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

        return Inertia::render('reservations/ReservationPage', [
            // 1. FILTERS (Lightweight, always passed)
            'filters' => $request->only(['search']),

            // 2. RESERVATION LIST (Lazy Loaded - The Heavy Lifter)
            // Only runs if explicitly requested or on first load
            'reservations' => fn () => $this->getReservations($request),

            // 3. STATS (Lazy Loaded - For Dashboard Badges)
            // Only runs if explicitly requested or on first load
            'stats' => fn () => $this->getStats(),

            // 4. STATIC DATA (Lazy Loaded - For Modals)
            // These rarely change, so we don't need to re-fetch them during polling
            'rooms' => fn () => Rooms::select('id', 'room_name', 'room_categories_id', 'max_extra_person', 'status')
                ->with(['roomCategory'])
                ->get(),
                
            'services' => fn () => Services::select('id', 'services_name', 'services_price')->get(),
        ]);
    }

    // --- PRIVATE OPTIMIZED HELPERS ---

    private function getReservations(Request $request)
    {
        $search = $request->input('search');

        return Reservation::query()
            // A. Eager Load ONLY necessary columns to reduce memory/payload
            ->with([
                'room:id,room_name,room_categories_id', 
                'services:id,services_name' 
            ])
            // B. Efficient Search
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('guest_name', 'like', "%{$search}%")
                      ->orWhere('contact_number', 'like', "%{$search}%")
                      // Optimized whereHas: checking existence is faster than loading models
                      ->orWhereHas('room', fn($subQ) => $subQ->where('room_name', 'like', "%{$search}%"));
                });
            })
            ->latest() // Equivalent to orderBy('created_at', 'desc')
            ->paginate(10) // Keep page size reasonable
            ->withQueryString();
    }

    private function getStats()
    {
        $today = Carbon::today();

        // C. Single Efficient Aggregate Query for Revenue & Pending
        // This avoids fetching all records into PHP memory
        $aggregates = Reservation::toBase()
            ->selectRaw("sum(case when status != ? then reservation_amount else 0 end) as total_revenue", [ReservationEnum::Pending->value])
            ->selectRaw("count(case when status = ? then 1 end) as pending_count", [ReservationEnum::Pending->value])
            ->first();

        // D. Simple Indexed Counts for Today's Activity
        $arrivals = Reservation::whereDate('check_in_date', $today)
            ->where('status', '!=', ReservationEnum::Cancelled->value)
            ->count();

        $departures = Reservation::whereDate('check_out_date', $today)
            ->where('status', '!=', ReservationEnum::Cancelled->value)
            ->count();

        return [
            'total_revenue' => (float) $aggregates->total_revenue,
            'arrivals_today' => $arrivals,
            'departures_today' => $departures,
            'pending_count' => (int) $aggregates->pending_count,
        ];
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