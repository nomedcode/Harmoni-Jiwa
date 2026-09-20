<?php

namespace Tests\Unit;

use App\Support\AuthRole;
use PHPUnit\Framework\TestCase;

class AuthRoleTest extends TestCase
{
    public function test_employee_role_is_read_from_app_metadata(): void
    {
        self::assertSame(
            AuthRole::EMPLOYEE,
            AuthRole::fromClaims(['app_metadata' => ['role' => 'karyawan']]),
        );
        self::assertTrue(AuthRole::canViewAllAppointments(AuthRole::EMPLOYEE));
    }

    public function test_user_metadata_cannot_grant_staff_access(): void
    {
        self::assertSame(
            AuthRole::PATIENT,
            AuthRole::fromClaims(['user_metadata' => ['role' => 'karyawan']]),
        );
        self::assertFalse(AuthRole::canViewAllAppointments(AuthRole::PATIENT));
    }
}
