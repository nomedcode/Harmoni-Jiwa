<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Employee;
use App\Models\Patient;
use App\Models\PatientQueue;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $appointments = Appointment::query()
            ->whereHas('patient.user', fn ($query) => $query->where('supabase_uid', $request->attributes->get('supabase_uid')))
            ->with(['employee:id,full_name,role', 'patient:id,full_name'])
            ->latest('scheduled_at')
            ->paginate(20);

        return response()->json($appointments);
    }

    public function staffIndex(): JsonResponse
    {
        $appointments = Appointment::query()
            ->with([
                'employee:id,full_name,role',
                'patient:id,user_id,full_name,gender,phone_number',
                'patient.user:id,full_name',
                'queue:id,appointment_id,status',
            ])
            ->latest('scheduled_at')
            ->paginate(50);

        return response()->json($appointments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:100'],
            'gender' => ['required', 'in:M,F'],
            'phone_number' => ['required', 'string', 'max:13'],
            'service_type' => ['required', 'string', 'max:100'],
            'schedule' => ['required', 'date', 'after:now'],
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
        ]);

        $startsAt = CarbonImmutable::parse($validated['schedule']);
        $endsAt = $startsAt->addMinutes(60);

        $appointment = DB::transaction(function () use ($request, $validated, $startsAt, $endsAt) {
            $user = User::where('supabase_uid', $request->attributes->get('supabase_uid'))->firstOrFail();
            Employee::whereKey($validated['employee_id'])->where('is_active', true)->lockForUpdate()->firstOrFail();

            $hasConflict = Appointment::where('employee_id', $validated['employee_id'])
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->where('scheduled_at', '<', $endsAt)
                ->where('ends_at', '>', $startsAt)
                ->lockForUpdate()
                ->exists();

            abort_if($hasConflict, 409, 'Jadwal tersebut sudah tidak tersedia.');

            $patient = Patient::firstOrCreate([
                'user_id' => $user->id,
                'full_name' => $validated['full_name'],
                'gender' => $validated['gender'],
                'phone_number' => $validated['phone_number'],
            ]);

            $appointment = Appointment::create([
                'patient_id' => $patient->id,
                'employee_id' => $validated['employee_id'],
                'service_type' => $validated['service_type'],
                'scheduled_at' => $startsAt,
                'ends_at' => $endsAt,
                'status' => 'requested',
            ]);

            PatientQueue::create(['appointment_id' => $appointment->id, 'status' => 'waiting']);

            return $appointment->load(['employee:id,full_name,role', 'patient:id,full_name']);
        });

        return response()->json(['message' => 'Janji temu berhasil dibuat', 'data' => $appointment], 201);
    }
}
