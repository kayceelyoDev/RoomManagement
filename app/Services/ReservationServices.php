<?php

namespace App\Services;


use App\Enum\ReservationEnum;
use App\Mail\ReservationConfirmed;
use App\Models\Reservation;
use Exception;
use Illuminate\Support\Carbon; // <--- Import Carbon
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class ReservationServices
{
    /**
     * Helper to detect overlapping reservations with a 3-hour cleaning buffer.
     */
    protected function checkAvailability($roomId, $checkIn, $checkOut, $excludeId = null)
    {
        // 1. Format Dates Standard (Prevents SQL issues with 'T' in datetime strings)
        $checkIn = Carbon::parse($checkIn)->format('Y-m-d H:i:s');
        $checkOut = Carbon::parse($checkOut)->format('Y-m-d H:i:s');

        $activeStatuses = [
            ReservationEnum::Pending,
            ReservationEnum::Confirmed,
            ReservationEnum::CheckedIn,
        ];

        $conflicts = Reservation::where('room_id', $roomId)
            ->whereIn('status', $activeStatuses)
            ->where(function ($query) use ($checkIn, $checkOut) {
              
                $query->where('check_in_date', '<', $checkOut)
                      ->whereRaw("DATE_ADD(check_out_date, INTERVAL 3 HOUR) > ?", [$checkIn]);
            })
            ->when($excludeId, function ($query, $id) {
                $query->where('id', '!=', $id);
            })
            ->exists();

        if ($conflicts) {
           
            throw ValidationException::withMessages([
                'check_in_date' => ['The selected dates are no longer available (includes cleaning buffer).']
            ]);
        }
    }

    public function createReservation(array $data)
    {
        // 1. Format Dates before doing anything
        $data['check_in_date'] = Carbon::parse($data['check_in_date'])->format('Y-m-d H:i:s');
        $data['check_out_date'] = Carbon::parse($data['check_out_date'])->format('Y-m-d H:i:s');

        $this->checkAvailability(
            $data['room_id'], 
            $data['check_in_date'], 
            $data['check_out_date']
        );

        DB::beginTransaction();
        try {
            $servicesData = $data['selected_services'] ?? [];
            unset($data['selected_services']);

            $data['status'] = $data['status'] ?? ReservationEnum::Pending;

            $reservation = Reservation::create($data);
            
            if (!empty($servicesData)) {
                foreach ($servicesData as $item) {
                    $reservation->services()->attach($item['id'], [
                        'quantity' => $item['quantity'],
                        'total_amount' => $item['price'] * $item['quantity']
                    ]);
                }
            }
            
            if ($reservation->user && $reservation->user->email) {
                try {
                    Mail::to($reservation->user->email)->queue(new ReservationConfirmed($reservation));
                } catch (\Throwable $e) {
                    Log::error("Email Error: " . $e->getMessage());
                }
            }

            Log::info("Reservation Created: #{$reservation->id}");

            DB::commit();
            return $reservation;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e; // Throw the REAL error so you can see it in logs
        }
    }

    public function updateReservation(Reservation $reservation, array $data)
    {
        // Format dates
        $data['check_in_date'] = Carbon::parse($data['check_in_date'])->format('Y-m-d H:i:s');
        $data['check_out_date'] = Carbon::parse($data['check_out_date'])->format('Y-m-d H:i:s');

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

            $syncPayload = [];
            foreach ($servicesData as $item) {
                $syncPayload[$item['id']] = [
                    'quantity' => $item['quantity'],
                    'total_amount' => $item['price'] * $item['quantity']
                ];
            }
            
            $reservation->services()->sync($syncPayload);

            DB::commit();
            return $reservation;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}