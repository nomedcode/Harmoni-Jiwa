<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = ['patient_id', 'employee_id', 'service_type', 'scheduled_at', 'ends_at', 'status', 'notes'];

    protected function casts(): array
    {
        return ['scheduled_at' => 'immutable_datetime', 'ends_at' => 'immutable_datetime'];
    }

    public function patient() { return $this->belongsTo(Patient::class); }
    public function employee() { return $this->belongsTo(Employee::class); }
    public function queue() { return $this->hasOne(PatientQueue::class); }
}
