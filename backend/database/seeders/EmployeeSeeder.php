<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    /**
     * Seed the clinic's psychiatrist as shown on the patient landing page.
     */
    public function run(): void
    {
        Employee::updateOrCreate(
            ['full_name' => 'dr. John Doe, Sp.KJ'],
            ['role' => 'Psychiatrist', 'is_active' => true],
        );
    }
}
