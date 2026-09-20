<?php

namespace Tests\Feature;

use Firebase\JWT\JWT;
use Tests\TestCase;

/**
 * Locks in the trust boundary enforced by VerifySupabaseJwt: a valid signature
 * alone is not enough, the token must also come from the expected issuer and
 * be addressed to an accepted audience.
 */
class SupabaseJwtVerificationTest extends TestCase
{
    private const SECRET = 'testing-secret-not-a-real-key-0123456789abcdef';
    private const ISSUER = 'https://test-project.supabase.co/auth/v1';

    /**
     * @param array<string, mixed> $overrides
     */
    private function token(array $overrides = []): string
    {
        return JWT::encode([
            'sub' => 'user-uid-1234',
            'iss' => self::ISSUER,
            'aud' => 'authenticated',
            'app_metadata' => ['provider' => 'email'],
            'iat' => time(),
            'exp' => time() + 3600,
            ...$overrides,
        ], self::SECRET, 'HS256');
    }

    public function test_request_without_token_is_rejected(): void
    {
        $this->postJson('/api/v1/appointments', [])
            ->assertStatus(401)
            ->assertJson(['message' => 'Authentication is required.']);
    }

    public function test_token_with_invalid_signature_is_rejected(): void
    {
        $forged = JWT::encode([
            'sub' => 'user-uid-1234',
            'iss' => self::ISSUER,
            'aud' => 'authenticated',
            'exp' => time() + 3600,
        ], 'a-completely-different-secret-0123456789abcdef', 'HS256');

        $this->withToken($forged)
            ->postJson('/api/v1/appointments', [])
            ->assertStatus(401)
            ->assertJson(['message' => 'Invalid authentication token.']);
    }

    public function test_token_from_another_issuer_is_rejected(): void
    {
        $token = $this->token(['iss' => 'https://attacker-project.supabase.co/auth/v1']);

        $this->withToken($token)
            ->postJson('/api/v1/appointments', [])
            ->assertStatus(401)
            ->assertJson(['message' => 'Invalid authentication token.']);
    }

    public function test_token_without_issuer_is_rejected(): void
    {
        $token = JWT::encode([
            'sub' => 'user-uid-1234',
            'aud' => 'authenticated',
            'exp' => time() + 3600,
        ], self::SECRET, 'HS256');

        $this->withToken($token)
            ->postJson('/api/v1/appointments', [])
            ->assertStatus(401)
            ->assertJson(['message' => 'Invalid authentication token.']);
    }

    public function test_token_with_unexpected_audience_is_rejected(): void
    {
        $token = $this->token(['aud' => 'some-other-service']);

        $this->withToken($token)
            ->postJson('/api/v1/appointments', [])
            ->assertStatus(401)
            ->assertJson(['message' => 'Invalid authentication token.']);
    }

    public function test_expired_token_is_rejected(): void
    {
        $token = $this->token(['iat' => time() - 7200, 'exp' => time() - 3600]);

        $this->withToken($token)
            ->postJson('/api/v1/appointments', [])
            ->assertStatus(401)
            ->assertJson(['message' => 'Invalid authentication token.']);
    }

    public function test_trusted_token_passes_verification(): void
    {
        // Reaching validation (422) proves the middleware accepted the token;
        // an empty payload cannot get this far otherwise.
        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', [])
            ->assertStatus(422);
    }

    public function test_audience_list_accepts_any_configured_value(): void
    {
        config(['services.supabase.jwt_audiences' => 'authenticated, service_role']);

        $this->withToken($this->token(['aud' => 'service_role']))
            ->postJson('/api/v1/appointments', [])
            ->assertStatus(422);
    }

    /**
     * HS256 is symmetric: anyone holding SUPABASE_JWT_SECRET can forge a
     * valid token. It must stay off unless explicitly enabled.
     */
    public function test_hs256_token_is_rejected_when_legacy_disabled(): void
    {
        config(['services.supabase.jwt_legacy_hs256_enabled' => false]);

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', [])
            ->assertStatus(401)
            ->assertJson(['message' => 'Invalid authentication token.']);
    }

    public function test_hs256_token_passes_when_legacy_explicitly_enabled(): void
    {
        config(['services.supabase.jwt_legacy_hs256_enabled' => true]);

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', [])
            ->assertStatus(422);
    }
}
