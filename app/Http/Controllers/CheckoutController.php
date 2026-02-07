<?php

namespace App\Http\Controllers;

use App\Models\Checkout;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Fetch only reservations that are currently in-house
        $reservations = Reservation::query()
            ->with(['room.roomCategory'])
            ->where('status', 'checked_in')
            ->orderBy('check_out_date', 'asc')
            ->get()
            ->map(function ($reservation) {
                return [
                    'id' => $reservation->id,
                    'guest_name' => $reservation->guest_name,
                    'room_name' => $reservation->room->room_name ?? 'Unassigned',
                    'category' => $reservation->room->roomCategory->room_category ?? 'Standard',
                    'check_out_date' => $reservation->check_out_date,
                    'status' => $reservation->status,
                ];
            });

        return Inertia::render('checkout/CheckoutPage', [
            'reservations' => $reservations
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
    public function store(Request $request)
    {
        $request->validate([
            'reservation_id' => 'required|exists:reservations,id',
            'remarks' => 'required|string|max:1000',
        ]);

        try {
            // Using a Transaction for Reliability: All steps must succeed or none will.
            DB::transaction(function () use ($request) {

                // 1. Create the Checkout Record
                Checkout::create([
                    'reservation_id' => $request->reservation_id,
                    'user_id' => auth()->id(), // Secured: Tracking the staff member
                    'remarks' => $request->remarks,
                ]);

                // 2. Update Reservation Status
                $reservation = Reservation::with('room')->findOrFail($request->reservation_id);
                $reservation->update([
                    'status' => 'checked_out' // Adjust based on your Enum
                ]);

                // 3. Set Room back to Available
                if ($reservation->room) {
                    $reservation->room->update([
                        'status' => 'available' // Now the room can be booked again
                    ]);
                }
            });

            return redirect()->back()->with('success', 'Guest has been checked out successfully.');

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to process checkout. Please try again.');
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Checkout $checkout)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Checkout $checkout)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Checkout $checkout)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Checkout $checkout)
    {
        //
    }
}
