<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;

class EmployeeController extends Controller
{
    /**
     * Active psychiatrists the booking form can offer.
     *
     * Only non-sensitive columns are exposed: the booking form needs a label
     * and an id, nothing else.
     */
    public function index(): JsonResponse
    {
        $employees = Employee::query()
            ->where('is_active', true)
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'role']);

        return response()->json(['data' => $employees]);
    }
}
