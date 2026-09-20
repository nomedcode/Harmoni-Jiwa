<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientQueue extends Model
{
    protected $fillable = ['appointment_id', 'status'];

    public function appointment() { return $this->belongsTo(Appointment::class); }
}
