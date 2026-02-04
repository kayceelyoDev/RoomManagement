<?php

namespace Database\Seeders;

use App\Models\Reservation;
use App\Models\Reservation_Services;
use App\Models\Rooms;
use App\Models\Services;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ReservationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $user = User::first();
        $room = Rooms::first();
        $service = Services::first();

        // 1. Create a dummy Reservation
        // Note: Assuming you have a Reservation model. 
        // If not, you must create one for this to work.
        $reservation = Reservation::create([
            'user_id' => $user->id,
            'guest_name'=>'guest1',
            'room_id' => $room->id,
            'contact_number' => '09123456789',
            'total_guest' => 2,
            'extra_person' => 0,
            'check_in_date' => Carbon::now()->addDays(1),
            'check_out_date' => Carbon::now()->addDays(3),
            'reservation_amount' => 5000.00,
            'status' => 'pending',
        ]);

        // 2. Populate the Pivot Table (Reservation_Services)
        // Scenario: Guest ordered 2 of the first service (e.g., 2 Breakfasts)
        Reservation_Services::create([
            'reservation_id' => $reservation->id,
            'services_id' => $service->id,
            'quantity' => 2,
            // Calculate total: Price * Quantity
            'total_amount' => $service->services_price * 2, 
        ]);
        
        // Scenario: Guest ordered 1 of another service
        $service2 = Services::find(2);
        if($service2) {
             Reservation_Services::create([
                'reservation_id' => $reservation->id,
                'services_id' => $service2->id,
                'quantity' => 1,
                'total_amount' => $service2->services_price, 
            ]);
        }
    }
}
