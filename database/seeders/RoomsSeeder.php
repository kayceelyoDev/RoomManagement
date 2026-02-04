<?php

namespace Database\Seeders;

use App\Models\RoomCategory;
use App\Models\Rooms;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoomsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $user = User::first() ?? User::factory()->create();
        
        // Get Categories
        $standard = RoomCategory::where('room_category', 'Standard Room')->first();
        $deluxe = RoomCategory::where('room_category', 'Deluxe Room')->first();
        
        $rooms = [
            [
                'room_categories_id' => $standard->id ?? 1,
                'room_name' => 'Room 101',
                'room_description' => 'A cozy room with a view of the garden.',
                'max_extra_person' => 1,
                'room_amenities' => 'WiFi, TV, AC, Shower',
                'type_of_bed' => 'Queen Size',
                'status' => 'available',
                'img_url' => '5VWhQc1GY1GVHYMGZGVptjlHbxNuRdBk1b6BqDbB.jpg', // Or 'room/placeholder.jpg'
                'user_id' => $user->id,
            ],
            [
                'room_categories_id' => $standard->id ?? 1,
                'room_name' => 'Room 102',
                'room_description' => 'Standard room located near the pool.',
                'max_extra_person' => 1,
                'room_amenities' => 'WiFi, TV, AC, Shower',
                'type_of_bed' => 'Twin Single',
                'status' => 'booked',
                'img_url' => '5VWhQc1GY1GVHYMGZGVptjlHbxNuRdBk1b6BqDbB.jpg',
                'user_id' => $user->id,
            ],
            [
                'room_categories_id' => $deluxe->id ?? 2,
                'room_name' => 'Room 205 (Deluxe)',
                'room_description' => 'Spacious room with a balcony and mini-bar.',
                'max_extra_person' => 2,
                'room_amenities' => 'WiFi, Smart TV, AC, Bathtub, Fridge',
                'type_of_bed' => 'King Size',
                'status' => 'available',
                'img_url' => '5VWhQc1GY1GVHYMGZGVptjlHbxNuRdBk1b6BqDbB.jpg',
                'user_id' => $user->id,
            ],
        ];

        foreach ($rooms as $room) {
            Rooms::create($room);
        }
    }
}
