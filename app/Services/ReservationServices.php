<?php

namespace App\Services;

use App\enum\ReservationEnum;
use App\Mail\ReservationConfirmed;
use App\Models\Reservation;
use Exception;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class ReservationServices
{
    private const BUFFER_HOURS = 3;

    protected function checkAvailability($roomId, $checkIn, $checkOut, $excludeId = null)
    {
        $newStart = Carbon::parse($checkIn);
        $newEnd   = Carbon::parse($checkOut)->addHours(self::BUFFER_HOURS);

        // FIX 1: Add 'checked_out' here. 
        // A checked-out room is still "occupied" by the cleaning buffer.
        $activeStatuses = [
            ReservationEnum::Pending->value,
            ReservationEnum::Confirmed->value,
            ReservationEnum::CheckedIn->value,
            ReservationEnum::CheckedOut->value, // <--- CRITICAL ADDITION
        ];

        $conflict = Reservation::where('room_id', $roomId)
            ->whereIn('status', $activeStatuses)
            ->where(function ($query) use ($newStart, $newEnd) {
                // Logic: (StartA < EndB) AND (EndA > StartB)
                // Existing End Time = check_out_date + 3 Hours Buffer
                $query->whereRaw('check_in_date < ?', [$newEnd])
                      ->whereRaw('DATE_ADD(check_out_date, INTERVAL ? HOUR) > ?', [self::BUFFER_HOURS, $newStart]);
            })
            ->when($excludeId, function ($query, $id) {
                $query->where('id', '!=', $id);
            })
            ->first();

        if ($conflict) {
            $conflictEnd = Carbon::parse($conflict->check_out_date);
            // Calculate strictly when the room is ready (Checkout + Buffer)
            $readyTime = $conflictEnd->copy()->addHours(self::BUFFER_HOURS);

            throw ValidationException::withMessages([
                'check_in_date' => [
                    "Conflict detected. This room is occupied or being cleaned until " . $readyTime->format('M d, h:i A') . "."
                ]
            ]);
        }
    }

    public function createReservation(array $data)
    {
        // ... (rest of the code remains the same)
        $data['check_in_date'] = Carbon::parse($data['check_in_date'])->format('Y-m-d H:i:s');
        $data['check_out_date'] = Carbon::parse($data['check_out_date'])->format('Y-m-d H:i:s');

        $this->checkAvailability(
            $data['room_id'], 
            $data['check_in_date'], 
            $data['check_out_date']
        );

        DB::beginTransaction();
        try {
            // ... (rest of logic)
            $servicesData = $data['selected_services'] ?? [];
            unset($data['selected_services']);

            $data['status'] = $data['status'] ?? ReservationEnum::Pending->value;

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
            throw $e; 
        }
    }

    public function updateReservation(Reservation $reservation, array $data)
    {
        // ... (rest of the code remains the same)
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