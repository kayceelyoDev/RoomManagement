<?php

namespace Database\Seeders;

use App\Enum\roles;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'Admin@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => roles::ADMIN,
        ]);

    //    $this->call([
    //         RoomCategorySeeder::class,
    //         ServicesSeeder::class,
    //         RoomsSeeder::class,       
    //         ReservationSeeder::class, 
    //     ]);
    }
}
