<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReservationRequest;
use App\Models\Reservation;
use App\Http\Controllers\Controller;
use App\Models\Rooms;
use App\Models\Services;
use App\Services\ReservationServices;
use Auth;
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

        // 1. Fetch Reservations with Search & Relationships
        $reservations = Reservation::with(['room', 'services'])
            ->when($search, function ($query, $search) {
                $query->where('contact_number', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    // Search by Room Name via relationship
                    ->orWhereHas('room', function ($q) use ($search) {
                        $q->where('room_name', 'like', "%{$search}%");
                    });
            })
            ->latest()
            ->get(); // Or ->paginate(10) if you want pagination

        // 2. Fetch dependencies
        $rooms = Rooms::latest()->with('roomCategory')->get();
        $services = Services::all();

        return Inertia::render('reservations/ReservationPage', [
            'reservations' => $reservations, // <-- Pass this to frontend
            'rooms' => $rooms,
            'services' => $services,
            'filters' => ['search' => $search] // Pass back search term to keep input filled
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

        $services->createReservation($data);

        return redirect('reservation');
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
    public function update(Request $request, Reservation $reservation)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Reservation $reservation)
    {
        //
    }
}
