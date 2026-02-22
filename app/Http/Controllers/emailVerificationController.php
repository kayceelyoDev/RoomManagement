<?php

namespace App\Http\Controllers;

use App\Enum\ReservationEnum;
use App\Mail\ReservationReceiptEmail;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class emailVerificationController extends Controller
{
    
    public function verifyReservation(Request $request, $id)
    {
        // 1. Find the reservation or fail with 404
        $reservation = Reservation::findOrFail($id);

        // 2. Idempotency Check: Don't process if already confirmed
        if ($reservation->status === ReservationEnum::Confirmed) {
            return view('reservation.success', [
                'message' => 'This reservation is already verified!',
                'reservation' => $reservation
            ]);
        }

        // 3. Process Verification
        try {
            DB::transaction(function () use ($reservation) {
                $reservation->update(['status' => ReservationEnum::Confirmed]);
            });

            // 4. Send Receipt Email (Queued for speed)
            if ($reservation->user && $reservation->guest_email) {
                try {
                    Mail::to($reservation->guest_email)->queue(new ReservationReceiptEmail($reservation));
                } catch (\Throwable $e) {
                    Log::error("Failed to queue receipt email for Res #{$reservation->id}: " . $e->getMessage());
                }
            }

            Log::info("Reservation #{$reservation->id} verified by email link.");

            return view('reservation.success', [
                'message' => 'Reservation verified successfully!',
                'reservation' => $reservation
            ]);

        } catch (\Exception $e) {
            Log::error("Error verifying reservation #{$id}: " . $e->getMessage());
            
            // Return a view instead of a raw error for better UX
            return view('reservation.error', [
                'message' => 'We could not verify your reservation at this time. Please contact support.'
            ]);
        }
    }
}