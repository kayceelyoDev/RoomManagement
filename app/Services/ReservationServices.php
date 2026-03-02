<?php

namespace App\Services;

use App\Enum\ReservationEnum;
use App\Mail\ReservationCancellationMain;
use App\Mail\ReservationConfirmed;
use App\Mail\ReservationReceiptEmail;
use App\Models\Reservation;
use Exception;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class ReservationServices
{
    private const BUFFER_HOURS = 3;

    protected function checkAvailability(int|string $roomId, string $checkIn, string $checkOut, ?int $excludeId = null): void
    {
        $newStart = Carbon::parse($checkIn);

       
        $newEnd = Carbon::parse($checkOut)->addHours(self::BUFFER_HOURS);

     
     
        $thresholdTime = $newStart->copy()->subHours(self::BUFFER_HOURS);

        $activeStatuses = [
            ReservationEnum::Pending->value,
            ReservationEnum::Confirmed->value,
            ReservationEnum::CheckedIn->value,
            ReservationEnum::CheckedOut->value,
        ];

        $conflict = Reservation::select('id', 'check_out_date')
            ->where('room_id', $roomId)
            ->whereIn('status', $activeStatuses)
            ->where(function ($query) use ($newEnd, $thresholdTime) {
                // 1. Existing Start < New End (with buffer)
                $query->where('check_in_date', '<', $newEnd)
                    // 2. Existing End > Threshold (New Start - Buffer)
                    // This replaces the raw DATE_ADD SQL
                    ->where('check_out_date', '>', $thresholdTime);
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

    public function createReservation(array $data): Reservation
    {
        $data['check_in_date'] = Carbon::parse($data['check_in_date'])->format('Y-m-d H:i:s');
        $data['check_out_date'] = Carbon::parse($data['check_out_date'])->format('Y-m-d H:i:s');

        $this->checkAvailability(
            $data['room_id'],
            $data['check_in_date'],
            $data['check_out_date']
        );

        $servicesData = Arr::pull($data, 'selected_services', []);

        return DB::transaction(function () use ($data, $servicesData) {
            $data['status'] = $data['status'] ?? ReservationEnum::Pending->value;

            $reservation = Reservation::create($data);

            if (!empty($servicesData)) {
                $syncPayload = [];
                foreach ($servicesData as $item) {
                    $syncPayload[$item['id']] = [
                        'quantity' => $item['quantity'],
                        'total_amount' => $item['price'] * $item['quantity']
                    ];
                }
                $reservation->services()->sync($syncPayload);
            }

            if ($reservation->user && $reservation->guest_email) {
                $this->dispatchEmailSafely($reservation->guest_email, new ReservationConfirmed($reservation));
            }

            Log::info("Reservation Created: #{$reservation->id}");

            return $reservation;
        });
    }

    public function updateReservation(Reservation $reservation, array $data): Reservation
    {
        $data['check_in_date'] = Carbon::parse($data['check_in_date'])->format('Y-m-d H:i:s');
        $data['check_out_date'] = Carbon::parse($data['check_out_date'])->format('Y-m-d H:i:s');

        $this->checkAvailability(
            $data['room_id'],
            $data['check_in_date'],
            $data['check_out_date'],
            $reservation->id
        );

        $servicesData = Arr::pull($data, 'selected_services', []);

        return DB::transaction(function () use ($reservation, $data, $servicesData) {
            $reservation->update($data);

            // Using strictly enum values to prevent typed bug errors on updates
            $statusValue = $reservation->status instanceof ReservationEnum
                ? $reservation->status->value
                : $reservation->status;

            if ($statusValue == ReservationEnum::Cancelled->value) {
                $this->dispatchEmailSafely($reservation->guest_email, new ReservationCancellationMain($reservation));
            } elseif ($statusValue == ReservationEnum::Confirmed->value) {
                $this->dispatchEmailSafely($reservation->guest_email, new ReservationReceiptEmail($reservation));
            }

            $syncPayload = [];
            foreach ($servicesData as $item) {
                $syncPayload[$item['id']] = [
                    'quantity' => $item['quantity'],
                    'total_amount' => $item['price'] * $item['quantity']
                ];
            }

            $reservation->services()->sync($syncPayload);

            Log::info("Reservation Updated: #{$reservation->id}");

            return $reservation;
        });
    }

    /**
     * Dispatch an email safely, catching exceptions so the main thread doesn't crash.
     */
    private function dispatchEmailSafely(?string $email, Mailable $mailable): void
    {
        if (!$email) {
            return;
        }

        try {
            Mail::to($email)->queue($mailable);
        } catch (\Throwable $e) {
            Log::error("Email Error: " . $e->getMessage());
        }
    }
}
