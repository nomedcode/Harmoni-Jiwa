<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Per-user throttle for appointment creation.
 *
 * This is deliberately a dedicated middleware rather than `throttle:...`.
 * Laravel's middleware priority list hoists Illuminate\Routing\Middleware\
 * ThrottleRequests ahead of application middleware, so a named throttle would
 * run before VerifySupabaseJwt and could only key on the client IP. That would
 * make every patient behind one NAT/office network share a single booking
 * quota. Running after JWT verification lets the quota follow the account.
 */
class ThrottleAppointmentCreation
{
    public function handle(Request $request, Closure $next): Response
    {
        $maxPerHour = (int) config('api.rate_limits.appointment_writes');

        if ($maxPerHour <= 0) {
            return $next($request);
        }

        $key = 'appointments:' . ($request->attributes->get('supabase_uid') ?: $request->ip());

        if (RateLimiter::tooManyAttempts($key, $maxPerHour)) {
            return response()->json([
                'message' => 'Terlalu banyak permintaan janji temu. Coba lagi nanti.',
            ], 429)->header('Retry-After', (string) RateLimiter::availableIn($key));
        }

        RateLimiter::hit($key, 3600);

        return $next($request);
    }
}
