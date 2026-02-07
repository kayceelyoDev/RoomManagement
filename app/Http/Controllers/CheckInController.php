<?php

namespace App\Http\Controllers;

use App\Enum\ReservationEnum;
use App\Models\Reservation;
use App\Services\CheckInservices;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CheckInController extends Controller
{
  

    public function index()
    {
        $reservations = Reservation::query()
            // Ensure foreign keys are selected so relationships can link correctly
            ->with(['room:id,room_name,room_categories_id', 'room.roomCategory:id,room_category'])
            ->whereIn('status', [ReservationEnum::Confirmed, ReservationEnum::Pending])
            ->whereDate('check_in_date', '>=', now()->subDays(1))
            ->orderBy('check_in_date', 'asc')
            ->get(['id', 'guest_name', 'total_guest', 'check_in_date', 'check_out_date', 'status', 'reservation_amount', 'room_id'])
            ->map(function ($reservation) {
                return [
                    'id' => $reservation->id,
                    'guest_name' => $reservation->guest_name,
                    'total_guest' => $reservation->total_guest,
                    'check_in_date' => $reservation->check_in_date,
                    'check_out_date' => $reservation->check_out_date,
                    'status' => $reservation->status,
                    // Explicitly map these for the frontend component
                    'room_name' => $reservation->room->room_name ?? 'Not assigned',
                    'category' => $reservation->room->roomCategory->room_category ?? 'Standard',
                    'amount' => (float) $reservation->reservation_amount,
                ];
            });

        return Inertia::render('checkin/CheckinPage', [
            'reservations' => $reservations
        ]);
    }

    public function store(Request $request, CheckInservices $checkInService)
    {
        // Removed payment_method validation
        $data = $request->validate([
            'reservation_id' => 'required|exists:reservations,id',
            'payment_amount' => 'required|numeric|min:0',
        ]);

        try {
            $checkInService->processCheckIn($data, auth()->id());
            return redirect()->back()->with('success', 'Check-in processed successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}