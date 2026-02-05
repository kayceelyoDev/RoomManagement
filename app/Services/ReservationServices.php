<?php

namespace App\Services;

use App\Mail\ReservationConfirmed;
use App\Models\Reservation;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class ReservationServices
{
    /**
     * Helper to detect overlapping reservations.
     * Throws ValidationException if a conflict is found.
     */
    protected function checkAvailability($roomId, $checkIn, $checkOut, $excludeId = null)
    {
        $conflicts = Reservation::where('room_id', $roomId)
            ->where('status', '!=', 'cancelled') // Ignore cancelled bookings
            ->where(function ($query) use ($checkIn, $checkOut) {
                // Overlap Logic: (NewStart < ExistingEnd) AND (NewEnd > ExistingStart)
                $query->where('check_in_date', '<', $checkOut)
                      ->where('check_out_date', '>', $checkIn);
            })
            ->when($excludeId, function ($query, $id) {
                // For updates: Don't conflict with yourself
                $query->where('id', '!=', $id);
            })
            ->exists();

        if ($conflicts) {
            throw ValidationException::withMessages([
                'room_id' => ['This room is already reserved for the selected dates.']
            ]);
        }
    }

    public function createReservation(array $data)
    {
       
        $this->checkAvailability(
            $data['room_id'], 
            $data['check_in_date'], 
            $data['check_out_date']
        );

        DB::beginTransaction();
        try {
            $servicesData = $data['selected_services'] ?? [];
            unset($data['selected_services']);

            $reservation = Reservation::create($data);
           
            if (!empty($servicesData)) {
                foreach ($servicesData as $item) {
                    $reservation->services()->attach($item['id'], [
                        'quantity' => $item['quantity'],
                        'total_amount' => $item['price'] * $item['quantity']
                    ]);
                }
            }
            Mail::to($reservation->user->email)->send(new ReservationConfirmed($reservation));
            DB::commit();
            return $reservation;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Handles the logic for updating an existing reservation.
     */
    public function updateReservation(Reservation $reservation, array $data)
    {
        // 1. Check for Conflicts (excluding current reservation ID)
        $this->checkAvailability(
            $data['room_id'], 
            $data['check_in_date'], 
            $data['check_out_date'],
            $reservation->id 
        );

        DB::beginTransaction();
        try {
            $servicesData = $data['selected_services'] ?? [];
            unset($data['selected_services']);

            // 2. Update Main Record
            $reservation->update($data);

            // 3. Sync Services (Smart update: removes old, adds new)
            $syncPayload = [];
            foreach ($servicesData as $item) {
                $syncPayload[$item['id']] = [
                    'quantity' => $item['quantity'],
                    'total_amount' => $item['price'] * $item['quantity']
                ];
            }
            // Sync is cleaner than detach/attach as it preserves existing IDs if they didn't change
            $reservation->services()->sync($syncPayload);

            DB::commit();
            return $reservation;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}