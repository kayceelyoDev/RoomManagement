<?php

use App\Enum\roles;
use App\Http\Controllers\emailVerificationController;
use App\Http\Controllers\GuestPage;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\RoomCategoryController;
use App\Http\Controllers\RoomsController;
use App\Http\Controllers\ServicesController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', [GuestPage::class, 'getRooms'])->name('home');

Route::middleware(['auth', 'verified', 'role'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('rooms', RoomsController::class);
    
    Route::resource('roomcategory', RoomCategoryController::class);
    Route::resource('services', ServicesController::class);
});

///email verification routres///
Route::resource('reservation', ReservationController::class)->middleware(['auth','verified']);
Route::get('/reservation/verify/{id}', [emailVerificationController::class, 'verifyReservation'])->name('reservation.verify')->middleware('signed');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/reservation/cancel/{reservation}', [GuestPage::class, 'cancel'])
        ->name('reservation.cancel');
    Route::get('guestpage', [GuestPage::class, 'guestPageRooms'])->name('guest.guestpage');
     Route::get('/myreservation', [GuestPage::class, 'myReservations'])->name('guest.myreservation');
});

Route::get('/test-error', fn() => Inertia::render('error/ErrorPage'))->name('error');
require __DIR__ . '/settings.php';
