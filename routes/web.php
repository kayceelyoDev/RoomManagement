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

// Apply a global rate limit to ALL web routes (60 requests per minute per IP)
// This secures your entire router against generic DDoS, bot spam, and brute force attacks.
Route::middleware(['throttle:api'])->group(function () {

    Route::get('/', [GuestPage::class, 'getRooms'])->name('home');

    // Dashboard & Core Operations
    Route::middleware(['auth', 'verified', 'role', 'throttle:api'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('analytics', [DashboardController::class, 'analytics'])->name('analytics')->middleware('can:access-analytics');
        Route::resource('rooms', RoomsController::class);
        Route::resource('roomcategory', RoomCategoryController::class);
        Route::resource('services', ServicesController::class);
        Route::resource('checkin', CheckInController::class);
        Route::resource('checkout', CheckoutController::class);
        Route::get('/api/dashboard/reservations', [DashboardController::class, 'getCalendarReservations']);
        Route::get('/api/dashboard/reservations/date', [DashboardController::class, 'getReservationsForSpecificDate']);
        Route::resource('usermanagement', UserController::class)->middleware('can:manage-user');
    });

    // Reservation endpoints: Tighter limit (30 requests per minute) as this writes to the database
    Route::resource('reservation', ReservationController::class)->middleware(['auth', 'verified', 'throttle:api']);

    // Sensitive email verification link: Super strict limit (5 requests per minute)
    Route::get('/reservation/verify/{id}', [emailVerificationController::class, 'verifyReservation'])
        ->name('reservation.verify')
        ->middleware(['signed', 'throttle:api']);

  
    Route::middleware(['auth', 'verified', 'throttle:api'])->group(function () {
        Route::post('/reservation/cancel/{reservation}', [GuestPage::class, 'cancel'])->name('reservation.cancel');
        Route::get('guestpage', [GuestPage::class, 'guestPageRooms'])->name('guest.guestpage');
        Route::get('/myreservation', [GuestPage::class, 'myReservations'])->name('guest.myreservation');
    });

    Route::get('/test-error', fn() => Inertia::render('error/ErrorPage'))->name('error');

    // Also include the settings routes under the same DDoS protection
    require __DIR__ . '/settings.php';
});
