<?php

namespace App\Http\Controllers;

use App\Enum\ReservationEnum;
// DELETED: use App\Events\ReservationChannelUpdated; 
use App\Http\Requests\ReservationRequest;
use App\Models\Reservation;
use App\Models\Rooms;
use App\Models\Services;
use App\Services\ReservationServices;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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
        if (Gate::allows('acces-guest')) {
            return redirect()->route('guest.guestpage');
        }

        $search = $request->input('search');
        $today = Carbon::today();

        // 1. Fetch Reservations List
        $reservationsQuery = Reservation::with([
            'room:id,room_name,room_categories_id',
            'services:id,services_name'
        ]);

        // Apply search
        if ($search) {
            $reservationsQuery->where(function ($query) use ($search) {
                $query->where('guest_name', 'like', "%{$search}%")
                    ->orWhere('contact_number', 'like', "%{$search}%")
                    ->orWhereHas('room', fn($q) => $q->where('room_name', 'like', "%{$search}%"));
            });
        }

        $reservations = $reservationsQuery->latest()->get();

        // 2. ANALYTICS CALCULATIONS (Independent of search for global overview)
        $allReservations = Reservation::whereIn('status', [
            ReservationEnum::Pending,
            ReservationEnum::Confirmed,
            ReservationEnum::CheckedIn
        ])->get();

        $stats = [
            'total_revenue' => $allReservations->where('status', '!=', ReservationEnum::Pending)->sum('reservation_amount'),
            'arrivals_today' => Reservation::whereDate('check_in_date', $today)
                ->where('status', '!=', ReservationEnum::Cancelled)
                ->count(),
            'departures_today' => Reservation::whereDate('check_out_date', $today)
                ->where('status', '!=', ReservationEnum::Cancelled)
                ->count(),
            'pending_count' => $allReservations->where('status', ReservationEnum::Pending)->count(),
        ];

        // 3. Fetch Rooms & Services (Keep as is)
        $rooms = Rooms::select('id', 'room_name', 'room_categories_id', 'max_extra_person', 'status')
            ->with([
                'roomCategory',
                'reservations' => function ($q) {
                    $q->whereIn('status', [ReservationEnum::Pending, ReservationEnum::Confirmed, ReservationEnum::CheckedIn])
                        ->where('check_out_date', '>=', now());
                }
            ])->get();

        $services = Services::select('id', 'services_name', 'services_price')->get();

        return Inertia::render('reservations/ReservationPage', [
            'reservations' => $reservations,
            'rooms' => $rooms,
            'services' => $services,
            'stats' => $stats, // Pass the new stats prop
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

        $services->createReservation($data);

        return redirect()->route('reservation.index')->with('success', 'Reservation created successfully.');
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