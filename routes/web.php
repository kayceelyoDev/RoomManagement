<?php

use App\Http\Controllers\RoomsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified', 'can:access-dashboard'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('rooms', RoomsController::class);
    
});

Route::middleware(['auth', 'verified', 'can:acces-guest'])->group(function(){
    Route::get('guestpage', function(){
        return Inertia::render('GuestPage');
    })->name('guest');
});

require __DIR__.'/settings.php';
