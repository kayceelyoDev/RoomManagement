<?php

namespace App\Services;

use App\Enum\ReservationEnum;
use App\Mail\ReservationConfirmed;
use App\Models\Reservation;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class ReservationServices
{
    /**
     * Helper to detect overlapping reservations with a 3-hour cleaning buffer.
     * Throws ValidationException if a conflict is found.
     */
    protected function checkAvailability($roomId, $checkIn, $checkOut, $excludeId = null)
    {
        // 1. Define statuses that "Block" the room.
        // We exclude 'Cancelled' and 'CheckedOut' (assuming CheckedOut means they left and room is ready after buffer)
        // If 'CheckedOut' usually means "Guest left but room not ready", add it here. 
        // Based on your prompt, we only block Pending, Confirmed, CheckedIn.
        $activeStatuses = [
            ReservationEnum::Pending,
            ReservationEnum::Confirmed,
            ReservationEnum::CheckedIn,
        ];

        $conflicts = Reservation::where('room_id', $roomId)
            ->whereIn('status', $activeStatuses) // Only check against active bookings
            ->where(function ($query) use ($checkIn, $checkOut) {
                // 2. Overlap Logic with 3-Hour Buffer
                // Existing Booking blocks the room from [CheckIn] until [CheckOut + 3 Hours]
                
                $query->where('check_in_date', '<', $checkOut)
                      ->whereRaw("DATE_ADD(check_out_date, INTERVAL 3 HOUR) > ?", [$checkIn]);
            })
            ->when($excludeId, function ($query, $id) {
                $query->where('id', '!=', $id);
            })
            ->exists();

        if ($conflicts) {
            throw ValidationException::withMessages([
                'room_id' => ['This room is unavailable for the selected time (includes required cleaning buffer).']
            ]);
        }
    }

    public function createReservation(array $data)
    {
        // 1. Check Availability First
        $this->checkAvailability(
            $data['room_id'], 
            $data['check_in_date'], 
            $data['check_out_date']
        );

        // 2. Database Transaction for Safety
        DB::beginTransaction();
        try {
            $servicesData = $data['selected_services'] ?? [];
            unset($data['selected_services']);

            // Ensure status defaults to Pending
            $data['status'] = $data['status'] ?? ReservationEnum::Pending;

            $reservation = Reservation::create($data);
            
            // Efficiently attach services
            if (!empty($servicesData)) {
                $servicesPayload = [];
                foreach ($servicesData as $item) {
                    $reservation->services()->attach($item['id'], [
                        'quantity' => $item['quantity'],
                        'total_amount' => $item['price'] * $item['quantity']
                    ]);
                }
            }
            
            // 3. Send Email in Background (Queued)
            // We wrap this in try-catch so email failures don't crash the reservation
            if ($reservation->user && $reservation->user->email) {
                try {
                    Mail::to($reservation->user->email)->queue(new ReservationConfirmed($reservation));
                } catch (\Throwable $e) {
                    Log::error("Failed to queue confirmation email for Res #{$reservation->id}: " . $e->getMessage());
                }
            }

            Log::info("New Reservation Created: #{$reservation->id} for {$reservation->guest_name}");

            DB::commit();
            return $reservation;

        } catch (Exception $e) {
            DB::rollBack();
            // Re-throw validation exceptions so the frontend sees the error message
            throw $e;
        }
    }

    public function updateReservation(Reservation $reservation, array $data)
    {
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

            $reservation->update($data);

            // Sync services (handles add/remove/update efficiently)
            $syncPayload = [];
            foreach ($servicesData as $item) {
                $syncPayload[$item['id']] = [
                    'quantity' => $item['quantity'],
                    'total_amount' => $item['price'] * $item['quantity']
                ];
            }
            
            $reservation->services()->sync($syncPayload);

            Log::info("Reservation Updated: #{$reservation->id}");

            DB::commit();
            return $reservation;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}