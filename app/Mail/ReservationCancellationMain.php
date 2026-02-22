<?php

namespace App\Mail;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReservationCancellationMain extends Mailable
{
    use Queueable, SerializesModels;

    public $reservation;
    public $isAutoCancelled;

    public function __construct(Reservation $reservation, $isAutoCancelled = false)
    {
        $this->reservation = $reservation;
        $this->isAutoCancelled = $isAutoCancelled;
    }
    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reservation Cancelled - #' . $this->reservation->id,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mails.reservation-cancel', // We will create this view next
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}