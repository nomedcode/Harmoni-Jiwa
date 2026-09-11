<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifySupabaseJwt
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $secret = config('services.supabase.jwt_secret');

        if (!$token || !$secret) {
            return response()->json(['message' => 'Authentication is required.'], 401);
        }

        [$header, $payload, $signature] = array_pad(explode('.', $token), 3, null);
        $expected = $header && $payload && $signature
            ? hash_hmac('sha256', $header.'.'.$payload, $secret, true)
            : null;

        if (!$expected || !hash_equals($expected, $this->decode($signature))) {
            return response()->json(['message' => 'Invalid authentication token.'], 401);
        }

        $claims = json_decode($this->decode($payload), true);
        if (!is_array($claims) || empty($claims['sub'])) {
            return response()->json(['message' => 'Invalid authentication claims.'], 401);
        }

        $request->attributes->set('supabase_uid', $claims['sub']);
        $request->attributes->set('supabase_claims', $claims);
        return $next($request);
    }

    private function decode(string $value): string
    {
        return base64_decode(strtr($value, '-_', '+/') . str_repeat('=', (4 - strlen($value) % 4) % 4), true) ?: '';
    }
}
