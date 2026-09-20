<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(EmployeeSeeder::class);

        User::factory()->create([
            'full_name' => 'Karyawan Klinik',
            'gender' => 'M',
            'phone_number' => '081234567890',
            'supabase_uid' => 'seed-admin-user',
        ]);
    }
}
