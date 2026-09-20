<?php

namespace App\Support;

final class AuthRole
{
    public const PATIENT = 'patient';
    public const EMPLOYEE = 'karyawan';
    public const ADMIN = 'admin';

    /**
     * Resolve only the trusted Supabase app_metadata role.
     * user_metadata is intentionally ignored because users can edit it.
     *
     * @param array<string, mixed> $claims
     */
    public static function fromClaims(array $claims): string
    {
        $appMetadata = $claims['app_metadata'] ?? [];
        $role = is_array($appMetadata)
            ? strtolower((string) ($appMetadata['role'] ?? ''))
            : '';

        return match ($role) {
            self::ADMIN => self::ADMIN,
            'staff', 'employee', self::EMPLOYEE => self::EMPLOYEE,
            default => self::PATIENT,
        };
    }

    public static function canViewAllAppointments(string $role): bool
    {
        return in_array($role, [self::ADMIN, self::EMPLOYEE], true);
    }
}
