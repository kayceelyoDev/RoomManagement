<?php

use App\Enum\roles;
use App\Http\Controllers\RoomsController;
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
});

// 1. Remove 'can:acces-guest' from here
Route::middleware(['auth', 'verified'])->group(function(){ 
    
    Route::get('guestpage', function(){

        // 2. Now this check will actually run
        // Note: Ensure the spelling matches your Gate definition ('acces' vs 'access')
        if (! Gate::allows('acces-guest')) {
            
            // 3. And this redirect will work
            return redirect()->route('error')->with('error', 'Guests only!');
        }

        return Inertia::render('GuestPage');
        
    })->name('guest');
});

Route::get('/test-error', fn () => Inertia::render('error/ErrorPage'))->name('error');
require __DIR__.'/settings.php';
