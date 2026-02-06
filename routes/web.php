<?php

use App\Enum\roles;
use App\Http\Controllers\CheckInController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\emailVerificationController;
use App\Http\Controllers\GuestPage;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\RoomCategoryController;
use App\Http\Controllers\RoomsController;
use App\Http\Controllers\ServicesController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', [GuestPage::class, 'getRooms'])->name('home');

Route::middleware(['auth', 'verified', 'role'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('analytics', [DashboardController::class, 'analytics'])->name('analytics');
    Route::resource('rooms', RoomsController::class);
    Route::resource('roomcategory', RoomCategoryController::class);
    Route::resource('services', ServicesController::class);
    Route::resource('checkin', CheckInController::class);
    Route::resource('checkout', CheckoutController::class);
    Route::resource('usermanagement', UserController::class);
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
