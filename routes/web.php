<?php

use App\Enum\roles;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\RoomCategoryController;
use App\Http\Controllers\RoomsController;
use App\Http\Controllers\ServicesController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified','role'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    Route::resource('rooms', RoomsController::class);
    Route::resource('reservation', ReservationController::class);
    Route::resource('roomcategory',RoomCategoryController::class);
    Route::resource('services', ServicesController::class);
});

// 1. Remove 'can:acces-guest' from here
Route::middleware(['auth', 'verified'])->group(function(){ 
    
    Route::get('guestpage', function(){
        if (! Gate::allows('acces-guest')) { 
            return redirect()->route('error')->with('error', 'Guests only!');
        }
        return Inertia::render('GuestPage');
    })->name('guest');
    
});

Route::get('/test-error', fn () => Inertia::render('error/ErrorPage'))->name('error');
require __DIR__.'/settings.php';
