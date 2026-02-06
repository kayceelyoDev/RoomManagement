<?php

namespace App\Services;

use App\Enum\ReservationEnum;
use App\Models\CheckIn;
use App\Models\Reservation;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckInservices
{
    /**
     * Process a guest check-in with payment and room status updates.
     *
     * @param array $data
     * @param int $userId The ID of the staff performing the check-in
     * @return Reservation
     * @throws ValidationException
     */
    public function processCheckIn(array $data, int $userId): Reservation
    {
        return DB::transaction(function () use ($data, $userId) {
            // 1. Fetch Reservation with Room (Lock for Update to prevent race conditions)
            $reservation = Reservation::with('room')->lockForUpdate()->findOrFail($data['reservation_id']);
            $room = $reservation->room;

            // 2. Security & Business Logic Validations
            $this->validateCheckInEligibility($reservation, $data['payment_amount']);

            // 3. Create Transaction (Storage efficient: only storing necessary foreign keys and decimal)
            $transaction = Transaction::create([
                'reservation_id' => $reservation->id,
                'payment_amount' => $data['payment_amount'],
                'payment_method' => $data['payment_method'] ?? 'cash',
                'user_id'        => $userId,
            ]);

            // 4. Create Check-In Record
            CheckIn::create([
                'reservation_id' => $reservation->id,
                'transaction_id' => $transaction->id,
                'user_id'        => $userId,
            ]);

            // 5. Atomic Updates: Status changes
            $reservation->update(['status' => ReservationEnum::CheckedIn]);

            if ($room) {
                // Ensure room moves to 'occupied'
                $room->update(['status' => 'occupied']);
            }

            return $reservation;
        });
    }

    /**
     * Centralized validation for check-in eligibility.
     */
    protected function validateCheckInEligibility(Reservation $reservation, $paymentAmount): void
    {
        // Check 1: No partial payments allowed
        if ($paymentAmount < $reservation->reservation_amount) {
            throw ValidationException::withMessages([
                'payment_amount' => ['Insufficient funds. Full payment of ₱' . number_format($reservation->reservation_amount, 2) . ' is required.']
            ]);
        }

        // Check 2: Ensure the reservation is actually ready for check-in
        if (!in_array($reservation->status, [ReservationEnum::Confirmed, ReservationEnum::Pending])) {
            throw ValidationException::withMessages([
                'reservation_id' => ['This reservation is not eligible for check-in (Current status: ' . $reservation->status->value . ').']
            ]);
        }

        // Check 3: Check if room is physically available (Optional but secure)
        if ($reservation->room && $reservation->room->status === 'unavailable') {
            throw ValidationException::withMessages([
                'reservation_id' => ['The assigned room is currently out of order/unavailable.']
            ]);
        }
    }
}