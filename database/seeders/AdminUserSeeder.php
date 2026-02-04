<?php

namespace Database\Seeders;

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
            ['email' => 'admin@gmail.com'], // Unique identifier
            [
                'name' => 'Super Admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin', // Ensure your 'users' table has a 'role' column
            ]
        );
    }
}
