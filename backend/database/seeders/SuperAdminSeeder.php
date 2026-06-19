<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'superadmin@pos.com'],
            [
                'name' => 'Global Super Admin',
                'password' => Hash::make('admin123'),
                'role' => 'super_admin',
            ]
        );
    }
}
