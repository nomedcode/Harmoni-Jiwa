<?php

namespace Tests\Feature;

use App\Models\Employee;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeListTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'testing-secret-not-a-real-key-0123456789abcdef';
    private const ISSUER = 'https://test-project.supabase.co/auth/v1';

    private function token(): string
    {
        return JWT::encode([
            'sub' => 'user-uid-1234',
            'iss' => self::ISSUER,
            'aud' => 'authenticated',
            'app_metadata' => ['provider' => 'email'],
            'iat' => time(),
            'exp' => time() + 3600,
        ], self::SECRET, 'HS256');
    }

    public function test_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/v1/employees')->assertStatus(401);
    }

    public function test_only_active_employees_are_listed(): void
    {
        Employee::create(['full_name' => 'dr. Aktif', 'role' => 'Psychiatrist', 'is_active' => true]);
        Employee::create(['full_name' => 'dr. Nonaktif', 'role' => 'Psychiatrist', 'is_active' => false]);

        $response = $this->withToken($this->token())
            ->getJson('/api/v1/employees')
            ->assertStatus(200);

        $names = array_column($response->json('data'), 'full_name');

        self::assertContains('dr. Aktif', $names);
        self::assertNotContains('dr. Nonaktif', $names);
    }

    public function test_response_exposes_only_safe_columns(): void
    {
        Employee::create(['full_name' => 'dr. Aktif', 'role' => 'Psychiatrist', 'is_active' => true]);

        $first = $this->withToken($this->token())
            ->getJson('/api/v1/employees')
            ->assertStatus(200)
            ->json('data.0');

        self::assertSame(['id', 'full_name', 'role'], array_keys($first));
    }

    public function test_employees_are_sorted_by_name(): void
    {
        Employee::create(['full_name' => 'dr. Zulkifli', 'role' => 'Psychiatrist', 'is_active' => true]);
        Employee::create(['full_name' => 'dr. Ahmad', 'role' => 'Psychiatrist', 'is_active' => true]);

        $names = array_column(
            $this->withToken($this->token())->getJson('/api/v1/employees')->json('data'),
            'full_name',
        );

        self::assertSame(['dr. Ahmad', 'dr. Zulkifli'], $names);
    }
}
