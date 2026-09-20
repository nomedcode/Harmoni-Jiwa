<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Employee;
use App\Models\Patient;
use App\Models\PatientQueue;
use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentBookingTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'testing-secret-not-a-real-key-0123456789abcdef';
    private const ISSUER = 'https://test-project.supabase.co/auth/v1';
    private const UID = 'patient-uid-0001';

    private Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->employee = Employee::create([
            'full_name' => 'dr. Aditama, Sp.KJ',
            'role' => 'Psychiatrist',
            'is_active' => true,
        ]);
    }

    /**
     * @param array<string, mixed> $appMetadata
     */
    private function token(string $subject = self::UID, array $appMetadata = []): string
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

    private function syncedUser(string $uid = self::UID, string $name = 'Budi Santoso'): User
    {
        return User::create([
            'supabase_uid' => $uid,
            'full_name' => $name,
            'gender' => 'M',
            'phone_number' => '081234567890',
            'role' => 'patient',
        ]);
    }

    /**
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'full_name' => 'Budi Santoso',
            'gender' => 'M',
            'phone_number' => '081234567890',
            'service_type' => 'Konsultasi awal',
            'schedule' => now()->addDays(3)->format('Y-m-d H:i:s'),
            'employee_id' => $this->employee->id,
            ...$overrides,
        ];
    }

    public function test_booking_creates_patient_appointment_and_queue(): void
    {
        $user = $this->syncedUser();

        $response = $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload())
            ->assertStatus(201)
            ->assertJsonPath('message', 'Janji temu berhasil dibuat');

        $appointmentId = $response->json('data.id');

        $this->assertDatabaseHas('patients', [
            'user_id' => $user->id,
            'full_name' => 'Budi Santoso',
        ]);
        $this->assertDatabaseHas('appointments', [
            'id' => $appointmentId,
            'employee_id' => $this->employee->id,
            'service_type' => 'Konsultasi awal',
            'status' => 'requested',
        ]);
        $this->assertDatabaseHas('patient_queues', [
            'appointment_id' => $appointmentId,
            'status' => 'waiting',
        ]);
    }

    public function test_same_name_with_different_identity_creates_separate_patients(): void
    {
        $user = $this->syncedUser();
        $firstSchedule = now()->addDays(3)->startOfHour()->format('Y-m-d H:i:s');
        $secondSchedule = now()->addDays(4)->startOfHour()->format('Y-m-d H:i:s');

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload([
                'schedule' => $firstSchedule,
            ]))
            ->assertStatus(201);

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload([
                'schedule' => $secondSchedule,
                'gender' => 'F',
                'phone_number' => '081234567891',
            ]))
            ->assertStatus(201);

        self::assertSame(2, Patient::where('user_id', $user->id)->count());
        $this->assertDatabaseHas('patients', [
            'user_id' => $user->id,
            'full_name' => 'Budi Santoso',
            'gender' => 'M',
            'phone_number' => '081234567890',
        ]);
        $this->assertDatabaseHas('patients', [
            'user_id' => $user->id,
            'full_name' => 'Budi Santoso',
            'gender' => 'F',
            'phone_number' => '081234567891',
        ]);
    }

    public function test_same_identity_reuses_patient_without_overwriting_data(): void
    {
        $user = $this->syncedUser();
        $firstSchedule = now()->addDays(3)->startOfHour()->format('Y-m-d H:i:s');
        $secondSchedule = now()->addDays(4)->startOfHour()->format('Y-m-d H:i:s');

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload(['schedule' => $firstSchedule]))
            ->assertStatus(201);

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload(['schedule' => $secondSchedule]))
            ->assertStatus(201);

        self::assertSame(1, Patient::where('user_id', $user->id)->count());
        $this->assertDatabaseHas('patients', [
            'user_id' => $user->id,
            'full_name' => 'Budi Santoso',
            'gender' => 'M',
            'phone_number' => '081234567890',
        ]);
    }

    public function test_appointment_lasts_one_hour(): void
    {
        $this->syncedUser();
        $start = now()->addDays(4)->startOfHour();

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload([
                'schedule' => $start->format('Y-m-d H:i:s'),
            ]))
            ->assertStatus(201);

        $appointment = Appointment::firstOrFail();

        self::assertEqualsWithDelta(
            60,
            $appointment->scheduled_at->diffInMinutes($appointment->ends_at),
            0.001,
        );
    }

    public function test_overlapping_slot_for_same_employee_is_rejected(): void
    {
        $this->syncedUser();
        $schedule = now()->addDays(5)->startOfHour()->format('Y-m-d H:i:s');

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload(['schedule' => $schedule]))
            ->assertStatus(201);

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload(['schedule' => $schedule]))
            ->assertStatus(409)
            ->assertJsonPath('message', 'Jadwal tersebut sudah tidak tersedia.');

        self::assertSame(1, Appointment::count());
    }

    public function test_partial_overlap_is_rejected(): void
    {
        $this->syncedUser();
        $start = now()->addDays(6)->startOfHour();

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload([
                'schedule' => $start->format('Y-m-d H:i:s'),
            ]))
            ->assertStatus(201);

        // Starts 30 minutes into the existing 60 minute slot.
        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload([
                'schedule' => $start->copy()->addMinutes(30)->format('Y-m-d H:i:s'),
            ]))
            ->assertStatus(409);
    }

    public function test_same_slot_on_another_employee_is_allowed(): void
    {
        $this->syncedUser();
        $other = Employee::create([
            'full_name' => 'dr. Kedua',
            'role' => 'Psychiatrist',
            'is_active' => true,
        ]);
        $schedule = now()->addDays(7)->startOfHour()->format('Y-m-d H:i:s');

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload(['schedule' => $schedule]))
            ->assertStatus(201);

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload([
                'schedule' => $schedule,
                'employee_id' => $other->id,
            ]))
            ->assertStatus(201);

        self::assertSame(2, Appointment::count());
    }

    public function test_cancelled_appointment_frees_the_slot(): void
    {
        $this->syncedUser();
        $schedule = now()->addDays(8)->startOfHour()->format('Y-m-d H:i:s');

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload(['schedule' => $schedule]))
            ->assertStatus(201);

        Appointment::query()->update(['status' => 'cancelled']);

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload(['schedule' => $schedule]))
            ->assertStatus(201);
    }

    public function test_inactive_employee_cannot_be_booked(): void
    {
        $this->syncedUser();
        $this->employee->update(['is_active' => false]);

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload())
            ->assertStatus(404);

        self::assertSame(0, Appointment::count());
    }

    public function test_past_schedule_is_rejected(): void
    {
        $this->syncedUser();

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload([
                'schedule' => now()->subDay()->format('Y-m-d H:i:s'),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('schedule');
    }

    public function test_unknown_employee_is_rejected(): void
    {
        $this->syncedUser();

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload(['employee_id' => 999999]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('employee_id');
    }

    public function test_invalid_gender_is_rejected(): void
    {
        $this->syncedUser();

        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload(['gender' => 'L']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('gender');
    }

    public function test_booking_without_synced_profile_fails(): void
    {
        // No User row exists for this token's subject yet.
        $this->withToken($this->token())
            ->postJson('/api/v1/appointments', $this->payload())
            ->assertStatus(404);
    }

    public function test_patient_only_sees_own_appointments(): void
    {
        $mine = $this->syncedUser();
        $theirs = $this->syncedUser('other-uid-0002', 'Orang Lain');

        $myPatient = Patient::create([
            'user_id' => $mine->id,
            'full_name' => 'Budi Santoso',
            'gender' => 'M',
            'phone_number' => '081234567890',
        ]);
        $theirPatient = Patient::create([
            'user_id' => $theirs->id,
            'full_name' => 'Orang Lain',
            'gender' => 'F',
            'phone_number' => '081234567891',
        ]);

        foreach ([$myPatient, $theirPatient] as $index => $patient) {
            $start = now()->addDays(10 + $index)->startOfHour();
            $appointment = Appointment::create([
                'patient_id' => $patient->id,
                'employee_id' => $this->employee->id,
                'service_type' => 'Konsultasi awal',
                'scheduled_at' => $start,
                'ends_at' => $start->copy()->addHour(),
                'status' => 'requested',
            ]);
            PatientQueue::create(['appointment_id' => $appointment->id, 'status' => 'waiting']);
        }

        $data = $this->withToken($this->token())
            ->getJson('/api/v1/appointments')
            ->assertStatus(200)
            ->json('data');

        self::assertCount(1, $data);
        self::assertSame($myPatient->id, $data[0]['patient_id']);
    }
}
