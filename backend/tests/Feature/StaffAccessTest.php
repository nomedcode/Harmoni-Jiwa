<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Employee;
use App\Models\Patient;
use App\Models\PatientQueue;
use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Guards the staff-only endpoints. Role must come from Supabase app_metadata,
 * never from user_metadata, which end users can edit themselves.
 */
class StaffAccessTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'testing-secret-not-a-real-key-0123456789abcdef';
    private const ISSUER = 'https://test-project.supabase.co/auth/v1';

    /**
     * @param array<string, mixed> $claims
     */
    private function token(array $claims = []): string
    {
        return JWT::encode([
            'sub' => 'uid-' . uniqid(),
            'iss' => self::ISSUER,
            'aud' => 'authenticated',
            'app_metadata' => ['provider' => 'email'],
            'iat' => time(),
            'exp' => time() + 3600,
            ...$claims,
        ], self::SECRET, 'HS256');
    }

    private function tokenWithRole(string $role): string
    {
        return $this->token(['app_metadata' => ['provider' => 'email', 'role' => $role]]);
    }

    private function seedAppointment(): Appointment
    {
        $user = User::create([
            'supabase_uid' => 'owner-' . uniqid(),
            'full_name' => 'Budi Santoso',
            'gender' => 'M',
            'phone_number' => '081234567890',
            'role' => 'patient',
        ]);
        $employee = Employee::create([
            'full_name' => 'dr. Aditama, Sp.KJ',
            'role' => 'Psychiatrist',
            'is_active' => true,
        ]);
        $patient = Patient::create([
            'user_id' => $user->id,
            'full_name' => 'Budi Santoso',
            'gender' => 'M',
            'phone_number' => '081234567890',
        ]);
        $start = now()->addDays(2)->startOfHour();
        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'employee_id' => $employee->id,
            'service_type' => 'Konsultasi awal',
            'scheduled_at' => $start,
            'ends_at' => $start->copy()->addHour(),
            'status' => 'requested',
        ]);
        PatientQueue::create(['appointment_id' => $appointment->id, 'status' => 'waiting']);

        return $appointment;
    }

    /**
     * @return array<string, array{string}>
     */
    public static function staffEndpointProvider(): array
    {
        return [
            'staff appointments' => ['/api/v1/staff/appointments'],
            'queues' => ['/api/v1/queues'],
        ];
    }

    #[DataProvider('staffEndpointProvider')]
    public function test_patient_is_denied(string $endpoint): void
    {
        $this->withToken($this->token())
            ->getJson($endpoint)
            ->assertStatus(403)
            ->assertJsonPath('message', 'Staff access is required.');
    }

    #[DataProvider('staffEndpointProvider')]
    public function test_karyawan_is_allowed(string $endpoint): void
    {
        $this->seedAppointment();

        $this->withToken($this->tokenWithRole('karyawan'))
            ->getJson($endpoint)
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    #[DataProvider('staffEndpointProvider')]
    public function test_admin_is_allowed(string $endpoint): void
    {
        $this->seedAppointment();

        $this->withToken($this->tokenWithRole('admin'))
            ->getJson($endpoint)
            ->assertStatus(200);
    }

    /**
     * Legacy English role names stay accepted per the documented contract.
     */
    #[DataProvider('legacyRoleProvider')]
    public function test_legacy_role_aliases_are_accepted(string $role): void
    {
        $this->withToken($this->tokenWithRole($role))
            ->getJson('/api/v1/staff/appointments')
            ->assertStatus(200);
    }

    /**
     * @return array<int, array{string}>
     */
    public static function legacyRoleProvider(): array
    {
        return [['staff'], ['employee']];
    }

    public function test_role_is_case_insensitive(): void
    {
        $this->withToken($this->tokenWithRole('KARYAWAN'))
            ->getJson('/api/v1/staff/appointments')
            ->assertStatus(200);
    }

    public function test_user_metadata_role_does_not_grant_access(): void
    {
        $token = $this->token([
            'app_metadata' => ['provider' => 'email'],
            'user_metadata' => ['role' => 'karyawan'],
        ]);

        $this->withToken($token)
            ->getJson('/api/v1/staff/appointments')
            ->assertStatus(403);
    }

    public function test_unknown_role_is_treated_as_patient(): void
    {
        $this->withToken($this->tokenWithRole('superuser'))
            ->getJson('/api/v1/staff/appointments')
            ->assertStatus(403);
    }

    public function test_staff_sees_appointments_from_all_patients(): void
    {
        $this->seedAppointment();
        $this->seedAppointment();

        $this->withToken($this->tokenWithRole('karyawan'))
            ->getJson('/api/v1/staff/appointments')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_queue_only_lists_active_statuses(): void
    {
        $appointment = $this->seedAppointment();
        PatientQueue::where('appointment_id', $appointment->id)->update(['status' => 'completed']);

        $this->withToken($this->tokenWithRole('karyawan'))
            ->getJson('/api/v1/queues')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}
