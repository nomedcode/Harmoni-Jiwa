<?php

namespace App\Http\Middleware;

use Closure;
use App\Support\AuthRole;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureKaryawan
{
    /**
     * Allow only clinic employees and administrators to view shared queues.
     *
     * Route URI keeps `/staff` for API compatibility. Internal class name
     * uses canonical role terminology: karyawan.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $claims = $request->attributes->get('supabase_claims', []);
        $role = AuthRole::fromClaims(is_array($claims) ? $claims : []);

        if (!AuthRole::canViewAllAppointments($role)) {
            return response()->json(['message' => 'Staff access is required.'], 403);
        }

        return $next($request);
    }
}
