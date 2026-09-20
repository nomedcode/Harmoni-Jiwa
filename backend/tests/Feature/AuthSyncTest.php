<?php

namespace Tests\Feature;

use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthSyncTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'testing-secret-not-a-real-key-0123456789abcdef';
    private const ISSUER = 'https://test-project.supabase.co/auth/v1';
    private const UID = 'sync-uid-0001';

    /**
     * @param array<string, mixed> $appMetadata
     */
    private function token(array $appMetadata = [], string $subject = self::UID): string
    {
        return JWT::encode([
            'sub' => $subject,
            'iss' => self::ISSUER,
            'aud' => 'authenticated',
            'app_metadata' => ['provider' => 'email', ...$appMetadata],
            'iat' => time(),
            'exp' => time() + 3600,
        ], self::SECRET, 'HS256');
    }

    public function test_first_sync_creates_user(): void
    {
        $this->withToken($this->token())
            ->postJson('/api/v1/auth/sync', [
                'full_name' => 'Budi Santoso',
                'gender' => 'M',
                'phone_number' => '081234567890',
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'supabase_uid' => self::UID,
            'full_name' => 'Budi Santoso',
            'role' => 'patient',
        ]);
    }

    public function test_repeat_sync_updates_instead_of_duplicating(): void
    {
        $this->withToken($this->token())
            ->postJson('/api/v1/auth/sync', ['full_name' => 'Budi Santoso'])
            ->assertStatus(201);

        $this->withToken($this->token())
            ->postJson('/api/v1/auth/sync', ['full_name' => 'Budi Updated'])
            ->assertStatus(200);

        self::assertSame(1, User::where('supabase_uid', self::UID)->count());
        $this->assertDatabaseHas('users', [
            'supabase_uid' => self::UID,
            'full_name' => 'Budi Updated',
        ]);
    }

    public function test_role_comes_from_app_metadata(): void
    {
        $this->withToken($this->token(['role' => 'karyawan']))
            ->postJson('/api/v1/auth/sync', ['full_name' => 'Karyawan Klinik'])
            ->assertStatus(201)
            ->assertJsonPath('data.role', 'karyawan');
    }

    /**
     * The request body must never be able to elevate a role. Only the signed
     * token decides.
     */
    public function test_role_in_request_body_is_ignored(): void
    {
        $this->withToken($this->token())
            ->postJson('/api/v1/auth/sync', [
                'full_name' => 'Budi Santoso',
                'role' => 'admin',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.role', 'patient');

        $this->assertDatabaseHas('users', [
            'supabase_uid' => self::UID,
            'role' => 'patient',
        ]);
    }

    public function test_full_name_is_required(): void
    {
        $this->withToken($this->token())
            ->postJson('/api/v1/auth/sync', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('full_name');
    }

    public function test_invalid_gender_is_rejected(): void
    {
        $this->withToken($this->token())
            ->postJson('/api/v1/auth/sync', [
                'full_name' => 'Budi Santoso',
                'gender' => 'L',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('gender');
    }

    public function test_separate_subjects_create_separate_users(): void
    {
        $this->withToken($this->token())
            ->postJson('/api/v1/auth/sync', ['full_name' => 'Orang Satu'])
            ->assertStatus(201);

        $this->withToken($this->token([], 'sync-uid-0002'))
            ->postJson('/api/v1/auth/sync', ['full_name' => 'Orang Dua'])
            ->assertStatus(201);

        self::assertSame(2, User::count());
    }

    public function test_sync_requires_authentication(): void
    {
        $this->postJson('/api/v1/auth/sync', ['full_name' => 'Budi Santoso'])
            ->assertStatus(401);
    }
}
