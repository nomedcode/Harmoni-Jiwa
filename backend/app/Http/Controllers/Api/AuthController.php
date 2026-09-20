<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\AuthRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:100'],
            'gender' => ['nullable', 'in:M,F'],
            'phone_number' => ['nullable', 'string', 'max:13'],
        ]);

        $claims = $request->attributes->get('supabase_claims', []);
        $role = AuthRole::fromClaims(is_array($claims) ? $claims : []);

        $user = User::updateOrCreate(
            ['supabase_uid' => $request->attributes->get('supabase_uid')],
            [...$validated, 'role' => $role],
        );

        return response()->json(['data' => $user], $user->wasRecentlyCreated ? 201 : 200);
    }
}
