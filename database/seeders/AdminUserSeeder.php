<?php

namespace Database\Seeders;

use App\Enum\roles;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        User::updateOrCreate(
            ['email' => 'superadmin@gmail.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('admin123'),
                'role' =>  roles::SUPPERADMIN,
                'email_verified_at' => now()
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin123'),
                'role' => roles::ADMIN,
                'email_verified_at' => now()
            ]
        );

        User::updateOrCreate(
            ['email' => 'staff@gmail.com'],
            [
                'name' => 'Staff',
                'password' => Hash::make('staff123'),
                'role' => roles::STAFF,
                'email_verified_at' => now()
            ]
        );

        User::updateOrCreate(
            ['email' => 'guest@gmail.com'],
            [
                'name' => 'Guest',
                'password' => Hash::make('guest123'),
                'role' => roles::GUEST,
                'email_verified_at' => now()
            ]
        );

        User::updateOrCreate(
            ['email' => 'kentclarence5368@gmail.com'],
            [
                'name' => 'kayceelyodev',
                'password' => Hash::make('yashu5368'),
                'role' => roles::SUPPERADMIN,
                'email_verified_at' => now()
            ]
        );
    }
}
