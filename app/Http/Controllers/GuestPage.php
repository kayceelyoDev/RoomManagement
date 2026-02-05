<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Rooms;
use App\Models\Services;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Laravel\Fortify\Features;

class GuestPage extends Controller
{
    public function getRooms()
    {
        // 1. Fetch Rooms with Categories AND Reservations (Critical for availability check)
        $rooms = Rooms::latest()
            ->with(['roomCategory', 'reservations']) // <--- Added 'reservations'
            ->get();

        // 2. Fetch Services so the modal works if opened from Welcome page (optional but good practice)
        $services = Services::latest()->get();

        // 3. Pass data to view
        return Inertia::render('welcome', [
            'rooms' => $rooms,
            'services' => $services, // Pass services here too just in case
            'canRegister' => Features::enabled(Features::registration()),
        ]);
    }

    public function guestPageRooms()
    {
        // 1. Security Check (Gate Authorization)
        if (!Gate::allows('acces-guest')) {
            return redirect()->route('error')->with('error', 'Guests only!');
        }

        // 2. Fetch Rooms
        // CRITICAL: We must use 'with()' to load 'reservations'.
        // The frontend calendar needs existing reservations to block dates.
        $rooms = Rooms::query()
            ->with([
                'roomCategory',
                'reservations' => function ($query) {
                    // Optimization: Only fetch bookings from today onwards to keep payload light
                    $query->where('check_out_date', '>=', now()->subDay())
                        ->select('id', 'room_id', 'check_in_date', 'check_out_date', 'status');
                }
            ])
            ->where('status', '!=', 'maintenance') // Example: Don't show rooms under maintenance
            ->latest()
            ->get();

        // 3. Fetch Services (for the Add-on section in the modal)
        $services = Services::all();

        // 4. Return View
        return Inertia::render('GuestPage', [
            'rooms' => $rooms,
            'services' => $services,
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    }

    public function myReservations()
    {
        $user = Auth::user();

        // 1. Fetch Reservations
        $reservations = Reservation::where('user_id', $user->id)
            ->with(['room.roomCategory', 'services'])
            ->orderBy('created_at', 'desc')
            ->get();

        // 2. Generate Smart Notifications
        $notifications = [];

        foreach ($reservations as $res) {
            // Pending Alert
            if ($res->status === 'pending') {
                $notifications[] = [
                    'id' => 'pending-' . $res->id,
                    'type' => 'warning',
                    'title' => 'Pending Confirmation',
                    'message' => "Your booking for {$res->room->room_name} is awaiting staff approval."
                ];
            }

            // Upcoming Trip Alert (within 3 days)
            if ($res->status === 'confirmed' && $res->check_in_date > now() && $res->check_in_date->diffInDays(now()) <= 3) {
                $notifications[] = [
                    'id' => 'upcoming-' . $res->id,
                    'type' => 'success',
                    'title' => 'Upcoming Stay!',
                    'message' => "Get ready! Your stay at {$res->room->room_name} starts " . $res->check_in_date->diffForHumans() . "."
                ];
            }
        }

        // 3. Render View
        // Make sure the component name matches your file name exactly (e.g., 'Guest/Reservations' or 'GuestReservationPage')
        return Inertia::render('GuestReservationPage', [
            'reservations' => $reservations,
            'notifications' => $notifications,
            'user' => $user
        ]);
    }
}