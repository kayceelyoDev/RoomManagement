<?php

namespace App\Http\Controllers;

use App\enum\ReservationEnum;
// DELETED: use App\Events\ReservationChannelUpdated; 
use App\Http\Requests\ReservationRequest;
use App\Models\Reservation;
use App\Models\Rooms;
use App\Models\Services;
use App\Services\ReservationServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ReservationController extends Controller
{
    /**
     * Display the Admin Reservation Dashboard.
     */
    public function index(Request $request)
    {
        // 1. Security Redirect
        if (Gate::allows('acces-guest')) {
            return redirect()->route('guest.guestpage');
        }

        $search = $request->input('search');

        // 2. Fetch Reservations List (Main Table)
        $reservations = Reservation::with([
            'room:id,room_name,room_categories_id',
            'services:id,services_name'
        ])
            ->when($search, function ($query, $search) {
                $query->where('guest_name', 'like', "%{$search}%")
                    ->orWhere('contact_number', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhereHas('room', function ($q) use ($search) {
                        $q->where('room_name', 'like', "%{$search}%");
                    });
            })
            ->latest()
            ->get();

        // 3. Fetch Rooms for Calendar/Modal
        $rooms = Rooms::select('id', 'room_name', 'room_categories_id', 'max_extra_person', 'status')
            ->with([
                'roomCategory:id,room_category,price,room_capacity',
                'reservations' => function ($query) {
                    $query->whereIn('status', [
                        ReservationEnum::Pending,
                        ReservationEnum::Confirmed,
                        ReservationEnum::CheckedIn
                    ])
                        ->where('check_out_date', '>=', now()) // Only future/current bookings
                        ->select('id', 'room_id', 'check_in_date', 'check_out_date', 'status');
                }
            ])
            ->get();

        // 4. Fetch Services (Lean)
        $services = Services::select('id', 'services_name', 'services_price')->get();

        return Inertia::render('reservations/ReservationPage', [
            'reservations' => $reservations,
            'rooms' => $rooms,
            'services' => $services,
            'filters' => ['search' => $search]
        ]);
    }

    /**
     * Store a newly created reservation.
     */
    public function store(ReservationRequest $request, ReservationServices $services)
    {
        $data = $request->validated();
        $data['user_id'] = Auth::id();

        try {
            // The service handles validation, transaction, and emails
            $services->createReservation($data);

            // DELETED: ReservationChannelUpdated::dispatch();

            return redirect()->route('reservation.index')->with('success', 'Reservation created successfully.');

        } catch (\Exception $e) {
            return back()->withErrors([
                'check_in_date' => 'The selected dates are no longer available. Please choose another date.'
            ]);
        }
    }

    /**
     * Update the specified reservation.
     */
    public function update(ReservationRequest $request, Reservation $reservation, ReservationServices $services)
    {
        $data = $request->validated();

        // The service handles conflict checking, data update, and pivot sync
        $services->updateReservation($reservation, $data);
        
        // DELETED: ReservationChannelUpdated::dispatch();
        
        return redirect()->back()->with('success', 'Reservation updated successfully.');
    }

    /**
     * Remove the specified reservation.
     */
    public function destroy(Reservation $reservation)
    {
        try {
            DB::transaction(function () use ($reservation) {
                // 1. Detach services first to maintain referential integrity
                $reservation->services()->detach();

                // 2. Delete the record
                $reservation->delete();
            });

            Log::info("Reservation #{$reservation->id} deleted by Admin " . Auth::id());
            
            // DELETED: ReservationChannelUpdated::dispatch();
            
            return redirect()->back()->with('success', 'Reservation deleted.');

        } catch (\Exception $e) {
            Log::error("Error deleting reservation #{$reservation->id}: " . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete reservation.');
        }
    }
}