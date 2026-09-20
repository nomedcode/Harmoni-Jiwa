<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PatientQueue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QueueController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(PatientQueue::with('appointment.patient', 'appointment.employee')
            ->whereIn('status', ['waiting', 'in_consultation'])
            ->latest()
            ->paginate(50));
    }
}
