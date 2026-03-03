<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Run every hour instead of every minute to reduce RAM usage
// Since reservations are cancelled after 2 hours, hourly checks are sufficient
Schedule::command('reservations:cancel-pending')->everyTenMinutes();
