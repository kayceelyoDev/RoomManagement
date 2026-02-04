<?php

namespace Database\Seeders;

use App\Models\RoomCategory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoomCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //

        $categories = [
            [
                'room_category' => 'Standard Room',
     
                'price' => 1500.00,
                'room_capacity' => 2,
            ],
            [
                'room_category' => 'Deluxe Room',
                'price' => 2500.00,
               
                'room_capacity' => 3,
            ],
            [
                'room_category' => 'Executive Suite',
                'price' => 5000.00,
                
                'room_capacity' => 4,
            ],
        ];

        foreach ($categories as $category) {
            RoomCategory::create($category);
        }
    }
}
