<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Middleware\VerifySupabaseJwt;
use App\Http\Middleware\EnsureStaff;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(VerifySupabaseJwt::class)->group(function () {
    Route::post('/auth/sync', [AuthController::class, 'sync']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/queues', [QueueController::class, 'index'])->middleware(EnsureStaff::class);
});