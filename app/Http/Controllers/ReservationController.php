<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReservationRequest;
use App\Models\Reservation;
use App\Http\Controllers\Controller;
use App\Models\Rooms;
use App\Models\Services;
use App\Services\ReservationServices;
use Auth;
use Gate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReservationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        if (Gate::allows('acces-guest')) {
            return redirect()->route('home');
        }
        // 1. Fetch Reservations List (for the main table)
        $reservations = Reservation::with(['room', 'services'])
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

        // 2. Fetch Rooms with Categories AND Active Reservations
        // We filter reservations to only include active ones (not cancelled) 
        // and those that end in the future to keep the payload size manageable.
        $rooms = Rooms::with([
            'roomCategory',
            'reservations' => function ($query) {
                $query->where('status', '!=', 'cancelled')
                    ->where('check_out_date', '>=', now()) // Only needed for availability check
                    ->select('id', 'room_id', 'check_in_date', 'check_out_date', 'status'); // Select only needed columns
            }
        ])->get();

        $services = Services::all();

        return Inertia::render('reservations/ReservationPage', [
            'reservations' => $reservations,
            'rooms' => $rooms,
            'services' => $services,
            'filters' => ['search' => $search]
        ]);
    }
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ReservationRequest $request, ReservationServices $services)
    {
        $data = $request->validated();
        $data['user_id'] = Auth::id();

        // The service will throw a ValidationException if dates conflict
        $services->createReservation($data);

        return redirect()->route('reservation.index')->with('success', 'Reservation created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Reservation $reservation)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Reservation $reservation)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ReservationRequest $request, Reservation $reservation, ReservationServices $services)
    {
        $data = $request->validated();

        // This handles conflict checking + data update + pivot sync
        $services->updateReservation($reservation, $data);

        return redirect()->back()->with('success', 'Reservation updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Reservation $reservation)
    {
        $reservation->services()->detach(); // Clean up pivot
        $reservation->delete();

        return redirect()->back()->with('success', 'Reservation deleted.');
    }
}
