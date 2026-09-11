<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaff
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $claims = $request->attributes->get('supabase_claims', []);
        $role = $claims['app_metadata']['role'] ?? $claims['user_metadata']['role'] ?? null;

        if (!in_array($role, ['admin', 'staff'], true)) {
            return response()->json(['message' => 'Staff access is required.'], 403);
        }

        return $next($request);
    }
}
