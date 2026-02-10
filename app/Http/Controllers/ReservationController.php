<?php

namespace App\Http\Controllers;

use App\Enum\ReservationEnum;
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
            'filters' => $request->only(['search']),
            'reservations' => fn() => $this->getReservations($request),
            'stats' => fn() => $this->getStats(),
            'rooms' => fn() => Rooms::select('id', 'room_name', 'room_categories_id', 'max_extra_person', 'status')
                ->with([
                    'roomCategory',
                    'reservations:id,room_id,check_in_date,check_out_date,status'
                ])
                ->get(),
            'services' => fn() => Services::select('id', 'services_name', 'services_price')->get(),
        ]);
    }

    private function getReservations(Request $request)
    {
        $search = $request->input('search');

        return Reservation::query()
            ->with([
                'room:id,room_name,room_categories_id',
                'services:id,services_name'
            ])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('guest_name', 'like', "%{$search}%")
                        ->orWhere('contact_number', 'like', "%{$search}%")
                        ->orWhereHas('room', fn($subQ) => $subQ->where('room_name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    private function getStats()
    {
        $today = Carbon::today();

        $aggregates = Reservation::toBase()
            ->selectRaw("sum(case when status != ? then reservation_amount else 0 end) as total_revenue", [ReservationEnum::Cancelled->value])
            ->selectRaw("count(case when status = ? then 1 end) as pending_count", [ReservationEnum::Pending->value])
            ->first();

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

    public function store(ReservationRequest $request, ReservationServices $services)
    {
        $data = $request->validated();
        $data['user_id'] = Auth::id();

        // Service handles conflict checks and logic
        $services->createReservation($data);

        return redirect()->route('reservation.index')->with('success', 'Reservation created successfully.');
    }

    public function update(ReservationRequest $request, Reservation $reservation, ReservationServices $services)
    {
        $data = $request->validated();

        $services->updateReservation($reservation, $data);

        return redirect()->back()->with('success', 'Reservation updated successfully.');
    }

    public function destroy(Reservation $reservation)
    {
        try {
            DB::transaction(function () use ($reservation) {
                $reservation->services()->detach();
                $reservation->delete();
            });

            Log::info("Reservation #{$reservation->id} deleted by Admin " . Auth::id());

            return redirect()->back()->with('success', 'Reservation deleted.');

        } catch (\Exception $e) {
            Log::error("Error deleting reservation #{$reservation->id}: " . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete reservation.');
        }
    }
}