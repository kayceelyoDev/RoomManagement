<?php

namespace App\Notifications;

use Carbon\Carbon;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class CustomVerifyEmail extends VerifyEmail
{
   public function toMail($notifiable)
    {
        // 1. Generate the verification URL manually
        $verificationUrl = $this->verificationUrl($notifiable);

        // 2. Return a custom view
        return (new MailMessage)
            ->subject('Welcome! Please Verify Your Email')
            ->view('mails.verify-email', ['url' => $verificationUrl, 'user' => $notifiable]);
    }

    // Helper to generate the signed URL (copied from parent to ensure access)
    protected function verificationUrl($notifiable)
    {
        if (static::$createUrlCallback) {
            return call_user_func(static::$createUrlCallback, $notifiable);
        }

        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(value: Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }
}
