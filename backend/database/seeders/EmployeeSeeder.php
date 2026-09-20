<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    /**
     * Seed the clinic's default psychiatrist.
     */
    public function run(): void
    {
        Employee::updateOrCreate(
            ['full_name' => 'dr. Aditama, Sp.KJ'],
            ['role' => 'Psychiatrist', 'is_active' => true],
        );
    }
}
