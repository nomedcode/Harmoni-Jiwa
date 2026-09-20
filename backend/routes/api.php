<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Middleware\VerifySupabaseJwt;
use App\Http\Middleware\EnsureKaryawan;
use App\Http\Middleware\ThrottleAppointmentCreation;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(VerifySupabaseJwt::class)->group(function () {
    Route::post('/auth/sync', [AuthController::class, 'sync']);
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store'])->middleware(ThrottleAppointmentCreation::class);
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/staff/appointments', [AppointmentController::class, 'staffIndex'])->middleware(EnsureKaryawan::class);
    Route::get('/queues', [QueueController::class, 'index'])->middleware(EnsureKaryawan::class);
});