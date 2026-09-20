<?php

namespace Tests\Feature;

use Firebase\JWT\JWT;
use Tests\TestCase;

/**
 * Laravel registers no API rate limiter by default. These tests ensure the
 * booking endpoint stays protected against flooding, which would otherwise
 * let one client occupy every available consultation slot.
 */
class ApiRateLimitTest extends TestCase
{
    private const SECRET = 'testing-secret-not-a-real-key-0123456789abcdef';
    private const ISSUER = 'https://test-project.supabase.co/auth/v1';

    private function token(string $subject = 'user-uid-1234'): string
    {
        return JWT::encode([
            'sub' => $subject,
            'iss' => self::ISSUER,
            'aud' => 'authenticated',
            'app_metadata' => ['provider' => 'email'],
            'iat' => time(),
            'exp' => time() + 3600,
        ], self::SECRET, 'HS256');
    }

    public function test_appointment_creation_is_throttled_per_user(): void
    {
        config(['api.rate_limits.appointment_writes' => 3]);

        $token = $this->token();

        // Invalid payloads still consume quota: throttling happens before the
        // controller, which is what stops a flood from being cheap.
        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $this->withToken($token)
                ->postJson('/api/v1/appointments', [])
                ->assertStatus(422);
        }

        $this->withToken($token)
            ->postJson('/api/v1/appointments', [])
            ->assertStatus(429);
    }

    public function test_throttle_is_scoped_per_user_not_globally(): void
    {
        config(['api.rate_limits.appointment_writes' => 2]);

        $first = $this->token('user-aaa');
        $second = $this->token('user-bbb');

        for ($attempt = 1; $attempt <= 2; $attempt++) {
            $this->withToken($first)->postJson('/api/v1/appointments', [])->assertStatus(422);
        }
        $this->withToken($first)->postJson('/api/v1/appointments', [])->assertStatus(429);

        // A different user must not inherit the exhausted quota.
        $this->withToken($second)->postJson('/api/v1/appointments', [])->assertStatus(422);
    }

    public function test_throttled_response_includes_retry_after_header(): void
    {
        config(['api.rate_limits.appointment_writes' => 1]);

        $token = $this->token('user-headers');

        $this->withToken($token)->postJson('/api/v1/appointments', [])->assertStatus(422);

        $this->withToken($token)
            ->postJson('/api/v1/appointments', [])
            ->assertStatus(429)
            ->assertHeader('Retry-After');
    }

    public function test_general_api_limiter_is_registered(): void
    {
        config(['api.rate_limits.general' => 2]);

        // Unauthenticated requests are cheap to send, so the IP-keyed limiter
        // must reject them once the budget is gone.
        $this->postJson('/api/v1/appointments', [])->assertStatus(401);
        $this->postJson('/api/v1/appointments', [])->assertStatus(401);
        $this->postJson('/api/v1/appointments', [])->assertStatus(429);
    }
}
