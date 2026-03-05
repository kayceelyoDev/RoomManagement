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

    protected function checkAvailability($roomId, $checkIn, $checkOut, int|string|null $excludeId = null): void
    {
        Log::debug('checkAvailability called', [
            'roomId' => $roomId,
            'checkIn' => $checkIn,
            'checkOut' => $checkOut,
            'excludeId' => $excludeId,
            'bufferHours' => self::BUFFER_HOURS
        ]);

        $newStart = Carbon::parse($checkIn);

       
        $newEnd = Carbon::parse($checkOut)->addHours(self::BUFFER_HOURS);

     
     
        $thresholdTime = $newStart->copy()->subHours(self::BUFFER_HOURS);

        $activeStatuses = [
            ReservationEnum::Pending->value,
            ReservationEnum::Confirmed->value,
            ReservationEnum::CheckedIn->value,
            ReservationEnum::CheckedOut->value,
        ];

        Log::debug('Checking for conflicts', [
            'thresholdTime' => $thresholdTime->toDateTimeString(),
            'newEnd' => $newEnd->toDateTimeString(),
            'activeStatuses' => $activeStatuses
        ]);

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
            Log::warning('Reservation conflict detected', [
                'conflictId' => $conflict->id,
                'conflictCheckOut' => $conflict->check_out_date
            ]);
            $conflictEnd = Carbon::parse($conflict->check_out_date);
            // Calculate strictly when the room is ready (Checkout + Buffer)
            $readyTime = $conflictEnd->copy()->addHours(self::BUFFER_HOURS);

            throw ValidationException::withMessages([
                'check_in_date' => [
                    "Conflict detected. This room is occupied or being cleaned until " . $readyTime->format('M d, h:i A') . "."
                ]
            ]);
        } else {
            Log::debug('No conflicts found - room is available', ['roomId' => $roomId]);
        }
    }

    public function createReservation(array $data): Reservation
    {
        Log::info('Creating new reservation', [
            'guest_name' => $data['guest_name'] ?? 'N/A',
            'room_id' => $data['room_id'] ?? 'N/A',
            'check_in' => $data['check_in_date'] ?? 'N/A',
            'check_out' => $data['check_out_date'] ?? 'N/A'
        ]);

        $data['check_in_date'] = Carbon::parse($data['check_in_date'])->format('Y-m-d H:i:s');
        $data['check_out_date'] = Carbon::parse($data['check_out_date'])->format('Y-m-d H:i:s');
        $data['room_id'] = (int) $data['room_id'];
        unset($data['g-recaptcha-response']);

        Log::debug('Parsed dates and room_id', [
            'check_in_date' => $data['check_in_date'],
            'check_out_date' => $data['check_out_date'],
            'room_id' => $data['room_id']
        ]);

        $this->checkAvailability(
            $data['room_id'],
            $data['check_in_date'],
            $data['check_out_date']
        );

        $servicesData = Arr::pull($data, 'selected_services', []);

        Log::debug('Services data extracted', [
            'serviceCount' => count($servicesData),
            'services' => $servicesData
        ]);

        return DB::transaction(function () use ($data, $servicesData) {
            $data['status'] = $data['status'] ?? ReservationEnum::Pending->value;

            Log::debug('Creating reservation in database', [
                'status' => $data['status'],
                'amount' => $data['reservation_amount'] ?? 'N/A'
            ]);

            $reservation = Reservation::create($data);

            Log::info('Reservation created successfully', [
                'reservationId' => $reservation->id,
                'status' => $reservation->status
            ]);

            if (!empty($servicesData)) {
                Log::debug('Syncing services for reservation', ['reservationId' => $reservation->id]);
                $syncPayload = [];
                foreach ($servicesData as $item) {
                    $syncPayload[$item['id']] = [
                        'quantity' => $item['quantity'],
                        'total_amount' => $item['price'] * $item['quantity']
                    ];
                    Log::debug('Added service to sync', [
                        'serviceId' => $item['id'],
                        'quantity' => $item['quantity'],
                        'totalAmount' => $item['price'] * $item['quantity']
                    ]);
                }
                $reservation->services()->sync($syncPayload);
                Log::info('Services synced successfully', ['reservationId' => $reservation->id, 'count' => count($syncPayload)]);
            } else {
                Log::debug('No services to sync', ['reservationId' => $reservation->id]);
            }

            if ($reservation->user && $reservation->guest_email) {
                Log::debug('Dispatching confirmation email', [
                    'reservationId' => $reservation->id,
                    'email' => $reservation->guest_email
                ]);
                $this->dispatchEmailSafely($reservation->guest_email, new ReservationConfirmed($reservation));
            } else {
                Log::debug('Email not sent - missing user or guest_email', [
                    'hasUser' => !!$reservation->user,
                    'guestEmail' => $reservation->guest_email
                ]);
            }

            Log::info("Reservation Created: #{$reservation->id}");

            return $reservation;
        });
    }

    public function updateReservation(Reservation $reservation, array $data): Reservation
    {
        
        Log::info('Updating reservation', [
            'reservationId' => $reservation->id,
            'currentStatus' => $reservation->status,
            'newStatus' => $data['status'] ?? 'unchanged',
            'room_id' => $data['room_id'] ?? 'unchanged'
        ]);

        $data['check_in_date'] = Carbon::parse($data['check_in_date'])->format('Y-m-d H:i:s');
        $data['check_out_date'] = Carbon::parse($data['check_out_date'])->format('Y-m-d H:i:s');
        $data['room_id'] = (int) $data['room_id'];
        unset($data['g-recaptcha-response']);

        Log::debug('Parsed update data', [
            'reservationId' => $reservation->id,
            'check_in' => $data['check_in_date'],
            'check_out' => $data['check_out_date'],
            'room_id' => $data['room_id']
        ]);

        

        $servicesData = Arr::pull($data, 'selected_services', []);

        Log::debug('Services data for update', [
            'serviceCount' => count($servicesData),
            'services' => $servicesData
        ]);

        return DB::transaction(function () use ($reservation, $data, $servicesData) {
            Log::debug('Updating reservation in database', [
                'reservationId' => $reservation->id,
                'updateData' => $data
            ]);

            $reservation->update($data);
            $reservation->refresh();

            Log::info('Reservation updated in database', [
                'reservationId' => $reservation->id,
                'newStatus' => $reservation->status
            ]);

            // Using strictly enum values to prevent typed bug errors on updates
            $statusValue = $reservation->status instanceof ReservationEnum
                ? $reservation->status->value
                : $reservation->status;

            Log::debug('Checking status for email dispatch', [
                'statusValue' => $statusValue,
                'isEnum' => $reservation->status instanceof ReservationEnum
            ]);

            if ($statusValue == ReservationEnum::Cancelled->value) {
                Log::debug('Sending cancellation email', ['reservationId' => $reservation->id]);
                $this->dispatchEmailSafely($reservation->guest_email, new ReservationCancellationMain($reservation));
            } elseif ($statusValue == ReservationEnum::Confirmed->value) {
                Log::debug('Sending receipt email', ['reservationId' => $reservation->id]);
                $this->dispatchEmailSafely($reservation->guest_email, new ReservationReceiptEmail($reservation));
            } else {
                Log::debug('No email dispatched for status', ['statusValue' => $statusValue]);
            }

            Log::debug('Building sync payload for update', ['reservationId' => $reservation->id]);
            $syncPayload = [];
            foreach ($servicesData as $item) {
                $syncPayload[$item['id']] = [
                    'quantity' => $item['quantity'],
                    'total_amount' => $item['price'] * $item['quantity']
                ];
                Log::debug('Added service to update sync', [
                    'serviceId' => $item['id'],
                    'quantity' => $item['quantity'],
                    'totalAmount' => $item['price'] * $item['quantity']
                ]);
            }

            $reservation->services()->sync($syncPayload);
            Log::info('Services synced on update', ['reservationId' => $reservation->id, 'count' => count($syncPayload)]);

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
            Log::warning('Email dispatch skipped - no email address provided');
            return;
        }

        try {
            Log::debug('Queuing email', [
                'email' => $email,
                'mailableClass' => get_class($mailable)
            ]);
            Mail::to($email)->queue($mailable);
            Log::info('Email queued successfully', [
                'email' => $email,
                'mailableClass' => get_class($mailable)
            ]);
        } catch (\Throwable $e) {
            Log::error("Email Error: " . $e->getMessage(), [
                'email' => $email,
                'mailableClass' => get_class($mailable),
                'exception' => get_class($e)
            ]);
        }
    }
}
