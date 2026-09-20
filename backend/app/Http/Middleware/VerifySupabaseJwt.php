<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

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

        if (!$token) {
            return response()->json(['message' => 'Authentication is required.'], 401);
        }

        try {
            $claims = $this->decodeToken($token, $secret);
        } catch (Throwable) {
            return response()->json(['message' => 'Invalid authentication token.'], 401);
        }

        if (empty($claims['sub'])) {
            return response()->json(['message' => 'Invalid authentication claims.'], 401);
        }

        if (!$this->hasTrustedIssuer($claims)) {
            return response()->json(['message' => 'Invalid authentication token.'], 401);
        }

        if (!$this->hasAcceptedAudience($claims)) {
            return response()->json(['message' => 'Invalid authentication token.'], 401);
        }

        $request->attributes->set('supabase_uid', $claims['sub']);
        $request->attributes->set('supabase_claims', $claims);

        return $next($request);
    }

    /**
     * Rejects tokens minted by a different issuer. Without this check any party
     * holding the shared HS256 secret (or a token from another Supabase
     * project) could forge credentials for this API.
     *
     * @param array<string, mixed> $claims
     */
    private function hasTrustedIssuer(array $claims): bool
    {
        return ($claims['iss'] ?? null) === $this->expectedIssuer();
    }

    /**
     * Misconfiguration must fail loudly rather than silently rejecting every
     * request, which would look like a token problem instead of a config one.
     */
    private function expectedIssuer(): string
    {
        $issuer = (string) config('services.supabase.jwt_issuer');

        if ($issuer === '') {
            $projectUrl = rtrim((string) config('services.supabase.url'), '/');

            if ($projectUrl === '') {
                throw new \RuntimeException(
                    'Supabase issuer is not configured. Set SUPABASE_URL or SUPABASE_JWT_ISSUER.',
                );
            }

            $issuer = $projectUrl . '/auth/v1';
        }

        return rtrim($issuer, '/');
    }

    /**
     * @param array<string, mixed> $claims
     */
    private function hasAcceptedAudience(array $claims): bool
    {
        $accepted = $this->acceptedAudiences();

        if ($accepted === []) {
            return true;
        }

        // "aud" may be a single string or a list of strings per RFC 7519.
        $tokenAudiences = array_map('strval', (array) ($claims['aud'] ?? []));

        return array_intersect($tokenAudiences, $accepted) !== [];
    }

    /**
     * @return list<string>
     */
    private function acceptedAudiences(): array
    {
        return array_values(array_filter(array_map(
            'trim',
            explode(',', (string) config('services.supabase.jwt_audiences')),
        ), static fn (string $audience): bool => $audience !== ''));
    }

    /**
     * Verify HS256 legacy tokens with the configured secret or asymmetric
     * Supabase tokens with the project's published JWKS keys.
     *
     * @return array<string, mixed>
     */
    private function decodeToken(string $token, ?string $secret): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new \UnexpectedValueException('Malformed JWT.');
        }

        $header = json_decode($this->decodeSegment($parts[0]), true);
        $algorithm = is_array($header) ? ($header['alg'] ?? null) : null;
        $legacyAlgorithm = config('services.supabase.jwt_algorithm', 'HS256');
        $legacyEnabled = (bool) config('services.supabase.jwt_legacy_hs256_enabled', false);

        if ($algorithm === $legacyAlgorithm) {
            // HS256 uses one shared secret to sign AND verify. Anyone who
            // holds SUPABASE_JWT_SECRET can forge a valid token for any
            // role. Supabase now issues ES256 (asymmetric, verified via
            // public JWKS, private key never touches this server), so
            // HS256 stays off by default. Enable only for legacy Supabase
            // projects still on the old shared-secret signing key.
            if (!$legacyEnabled) {
                throw new \UnexpectedValueException('HS256 legacy verification is disabled.');
            }

            if (!$secret) {
                throw new \UnexpectedValueException('JWT secret is not configured.');
            }

            return $this->toArray(JWT::decode($token, new Key($secret, $legacyAlgorithm)));
        }

        if ($algorithm !== 'ES256') {
            throw new \UnexpectedValueException('Unsupported JWT algorithm.');
        }

        $jwksUrl = config('services.supabase.jwks_url')
            ?: rtrim((string) config('services.supabase.url'), '/') . '/auth/v1/.well-known/jwks.json';

        if ($jwksUrl === '/auth/v1/.well-known/jwks.json') {
            throw new \UnexpectedValueException('Supabase JWKS URL is not configured.');
        }

        $jwks = Cache::store('file')->remember(
            'supabase-jwks',
            now()->addHour(),
            fn (): array => Http::acceptJson()->timeout(5)->get($jwksUrl)->throw()->json(),
        );

        return $this->toArray(JWT::decode($token, JWK::parseKeySet($jwks)));
    }

    /**
     * Recursively converts the stdClass tree returned by JWT::decode() into
     * a plain associative array, so nested claims like app_metadata are
     * arrays (not stdClass) when consumed by AuthRole::fromClaims().
     *
     * @return array<string, mixed>
     */
    private function toArray(mixed $decoded): array
    {
        return json_decode(json_encode($decoded), true);
    }

    private function decodeSegment(string $value): string
    {
        return base64_decode(
            strtr($value, '-_', '+/') . str_repeat('=', (4 - strlen($value) % 4) % 4),
            true,
        ) ?: '';
    }
}
