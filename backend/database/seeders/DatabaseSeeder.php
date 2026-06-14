<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $branch = \Illuminate\Support\Facades\DB::table('branches')->first();
        $branchId = $branch ? $branch->id : null;

        User::create([
            'name' => 'Administrator',
            'email' => 'admin@pos.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'branch_id' => $branchId
        ]);
        User::create([
            'name' => 'Store Manager',
            'email' => 'manager@pos.com',
            'password' => Hash::make('manager123'),
            'role' => 'manager',
            'branch_id' => $branchId
        ]);
        User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@pos.com',
            'password' => Hash::make('cashier123'),
            'role' => 'cashier',
            'branch_id' => $branchId
        ]);
    }
}
