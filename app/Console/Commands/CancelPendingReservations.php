<?php

namespace App\Console\Commands;

use App\enum\ReservationEnum;
use App\Mail\ReservationCancellationMain; // <-- Check if this should be 'Mail'
use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class CancelPendingReservations extends Command
{
    protected $signature = 'reservations:cancel-pending';
    protected $description = 'Cancel pending reservations older than 2 hours.';

    public function handle()
    {
        $this->info('Starting to cancel pending reservations older than 2 hours...');

        $twoHoursAgo = Carbon::now()->subHours(2);

        $reservations = Reservation::where('status', ReservationEnum::Pending)
            ->where('created_at', '<=', $twoHoursAgo)
            ->get();

        if ($reservations->isEmpty()) {
            $this->info('No pending reservations to cancel.');
            return;
        }

        foreach ($reservations as $reservation) {
            // 1. Update the status
            $reservation->status = ReservationEnum::Cancelled;
            $reservation->save();

            // 2. Safeguard: Check if email exists before sending
            if (!empty($reservation->guest_email)) {
                // 3. Performance: Use queue() instead of send() if queues are configured
                Mail::to($reservation->guest_email)->queue(new ReservationCancellationMain($reservation));
            } else {
                $this->warn("Reservation #{$reservation->id} cancelled, but no email was found.");
            }

            $this->info("Reservation #{$reservation->id} has been cancelled.");
        }

        $this->info('Finished cancelling pending reservations.');
    }
}