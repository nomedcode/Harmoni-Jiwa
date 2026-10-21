<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Employee;
use App\Models\Patient;
use App\Models\PatientQueue;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Demo data for the checkpoint presentation.
 *
 * Every insert is idempotent (updateOrCreate / firstOrCreate) so the seeder
 * can run repeatedly without duplicating rows. Demo patients are named
 * "John Doe N" and each patient owns exactly one appointment, so the staff
 * table shows every name once with a unique status: six patients cover the
 * six appointment statuses. Demo doctors mirror the staff shown on the
 * patient landing page (site.ts `doctor`). The two Supabase users below
 * carry the supabase_uid of the local demo accounts (karyawan@harmoni.test
 * and pasien@harmoni.test), so logging in through the frontend lands on
 * pre-populated data. Synthetic accounts (seed-*) exist so the staff
 * dashboard shows data from more than one patient.
 *
 * Service types match the booking form options (landing.ts
 * `bookingServices`). Queues only exist for active (upcoming / today)
 * appointments, mirroring what AppointmentController@store produces; queue
 * status mirrors the appointment status so QueueController's
 * waiting|in_consultation filter keeps the live queue accurate.
 */
class ClinicDemoSeeder extends Seeder
{
    public function run(): void
    {
        $johnDoe = Employee::updateOrCreate(
            ['full_name' => 'dr. John Doe, Sp.KJ'],
            ['role' => 'Psychiatrist', 'is_active' => true],
        );

        $karyawanUser = User::updateOrCreate(
            ['supabase_uid' => '1419754f-cd95-41db-8d09-f350fabf94ac'],
            ['full_name' => 'Admin Karyawan', 'gender' => 'M', 'phone_number' => '081200000001', 'role' => 'karyawan'],
        );
        $john1User = User::updateOrCreate(
            ['supabase_uid' => '96f898bf-a2dd-41dc-bfe5-ea76ceb12789'],
            ['full_name' => 'John Doe 1', 'gender' => 'M', 'phone_number' => '081200000002', 'role' => 'patient'],
        );
        // Preserves the original DatabaseSeeder intent (legacy demo staff).
        User::updateOrCreate(
            ['supabase_uid' => 'seed-admin-user'],
            ['full_name' => 'Karyawan Klinik', 'gender' => 'M', 'phone_number' => '081234567890', 'role' => 'karyawan'],
        );
        $john2User = User::updateOrCreate(
            ['supabase_uid' => 'seed-pasien-john2'],
            ['full_name' => 'John Doe 2', 'gender' => 'M', 'phone_number' => '081300000002', 'role' => 'patient'],
        );
        $john3User = User::updateOrCreate(
            ['supabase_uid' => 'seed-pasien-john3'],
            ['full_name' => 'John Doe 3', 'gender' => 'M', 'phone_number' => '081300000003', 'role' => 'patient'],
        );
        $john4User = User::updateOrCreate(
            ['supabase_uid' => 'seed-pasien-john4'],
            ['full_name' => 'John Doe 4', 'gender' => 'M', 'phone_number' => '081300000004', 'role' => 'patient'],
        );
        $john5User = User::updateOrCreate(
            ['supabase_uid' => 'seed-pasien-john5'],
            ['full_name' => 'John Doe 5', 'gender' => 'M', 'phone_number' => '081300000005', 'role' => 'patient'],
        );
        $john6User = User::updateOrCreate(
            ['supabase_uid' => 'seed-pasien-john6'],
            ['full_name' => 'John Doe 6', 'gender' => 'M', 'phone_number' => '081300000006', 'role' => 'patient'],
        );

        $patientFor = fn (User $user, string $name, string $gender, string $phone) => Patient::firstOrCreate(
            ['user_id' => $user->id],
            ['full_name' => $name, 'gender' => $gender, 'phone_number' => $phone],
        );
        $john1 = $patientFor($john1User, 'John Doe 1', 'M', '081200000002');
        $john2 = $patientFor($john2User, 'John Doe 2', 'M', '081300000002');
        $john3 = $patientFor($john3User, 'John Doe 3', 'M', '081300000003');
        $john4 = $patientFor($john4User, 'John Doe 4', 'M', '081300000004');
        $john5 = $patientFor($john5User, 'John Doe 5', 'M', '081300000005');
        $john6 = $patientFor($john6User, 'John Doe 6', 'M', '081300000006');

        $yesterday = Carbon::yesterday();
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        // One appointment per patient: every status appears exactly once, so
        // each name shows up in a single row and a single state.
        $bookings = [
            // Active queue (today / tomorrow) — rows visible through GET /queues.
            [$john1, 'Konsultasi remaja', $today->copy()->setTime(15, 0), 'in_consultation', null, 'in_consultation'],
            [$john2, 'Kecemasan & mood', $today->copy()->setTime(10, 0), 'confirmed', null, 'waiting'],
            [$john3, 'Konsultasi awal', $tomorrow->copy()->setTime(9, 0), 'requested', null, 'waiting'],
            // History (no queue rows; these left the active queue long ago).
            [$john4, 'Konsultasi awal', $yesterday->copy()->setTime(9, 0), 'completed', 'Sesi pertama, kondisi membaik.', null],
            [$john5, 'Kecemasan & mood', $yesterday->copy()->setTime(11, 0), 'cancelled', 'Pasien membatalkan karena berhalangan.', null],
            [$john6, 'Konsultasi remaja', $yesterday->copy()->setTime(14, 0), 'rejected', 'Ditolak: bentrok dengan slot darurat.', null],
        ];

        foreach ($bookings as [$patient, $service, $start, $status, $notes, $queueStatus]) {
            $appointment = Appointment::firstOrCreate(
                [
                    'patient_id' => $patient->id,
                    'employee_id' => $johnDoe->id,
                    'scheduled_at' => $start,
                ],
                [
                    'ends_at' => $start->copy()->addMinutes(60),
                    'service_type' => $service,
                    'status' => $status,
                    'notes' => $notes,
                ],
            );

            if ($queueStatus !== null) {
                PatientQueue::updateOrCreate(
                    ['appointment_id' => $appointment->id],
                    ['status' => $queueStatus],
                );
            }
        }
    }
}
