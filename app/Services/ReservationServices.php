<?php

namespace App\Services;

use App\Models\Reservation;
use Exception;
use Illuminate\Support\Facades\DB;

class ReservationServices
{
    /**
     * Create a new class instance.
     */
    public function createReservation(array $data)
    {
        DB::beginTransaction();
        try {
            // 1. Extract the services array from the main data
            // We default to an empty array if none are selected
            $servicesData = $data['selected_services'] ?? [];

            // 2. Remove 'selected_services' from $data
            // The Reservation model doesn't have this column, so we must remove it before creating.
            unset($data['selected_services']);

            // 3. Create the Main Reservation Record
            $reservation = Reservation::create($data);

            // 4. Attach Services to the Pivot Table (reservation_services)
            if (!empty($servicesData)) {
                foreach ($servicesData as $serviceItem) {
                    // $serviceItem comes from the frontend like: { "id": 1, "quantity": 2, "price": 500 }

                    $reservation->services()->attach($serviceItem['id'], [
                        'quantity' => $serviceItem['quantity'],
                        // Calculate total amount for this specific service line
                        'total_amount' => $serviceItem['price'] * $serviceItem['quantity']
                    ]);
                }
            }

            DB::commit();
            return $reservation;

        } catch (Exception $e) {
            DB::rollBack();
            // Optional: Log the error
            throw $e;
        }
    }
}
