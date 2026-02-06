<?php

namespace App\Http\Controllers;

use App\Enum\ReservationEnum;
use App\Models\Reservation;
use App\Models\Rooms;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();

        // 1. Operational Metrics based on your Room Migration
        $totalRooms = Rooms::count();
        $occupiedCount = Rooms::where('status', 'occupied')->count();
        $unavailableCount = Rooms::where('status', 'unavailable')->count();

        $stats = [
            'occupancy_rate' => $totalRooms > 0 ? round(($occupiedCount / $totalRooms) * 100) : 0,
            'arrivals_today' => Reservation::whereDate('check_in_date', $today)
                ->whereIn('status', [ReservationEnum::Confirmed, ReservationEnum::Pending])
                ->count(),
            'departures_today' => Reservation::whereDate('check_out_date', $today)
                ->where('status', ReservationEnum::CheckedIn)
                ->count(),
            'maintenance_count' => $unavailableCount,
        ];

        // 2. Room Inventory Breakdown (Matching your Enum)
        $roomStatus = [
            'available' => Rooms::where('status', 'available')->count(),
            'booked' => Rooms::where('status', 'booked')->count(),
            'occupied' => $occupiedCount,
            'unavailable' => $unavailableCount,
        ];

        // 3. Today's Guest Movement (Staff Task List)
        $guestMovements = Reservation::with('room:id,room_name')
            ->where(function ($q) use ($today) {
                $q->whereDate('check_in_date', $today)
                    ->orWhereDate('check_out_date', $today);
            })
            ->where('status', '!=', ReservationEnum::Cancelled)
            ->orderBy('check_in_date', 'asc')
            ->get();

        // 4. Room Availability Chart (Next 7 Days)
        // This is a mockup of volume to help with staffing
        $bookingVolume = Reservation::select(
            DB::raw('DATE(check_in_date) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->whereDate('check_in_date', '>=', now())
            ->whereDate('check_in_date', '<=', now()->addDays(7))
            ->groupBy('date')
            ->get();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'roomStatus' => $roomStatus,
            'guestMovements' => $guestMovements,
            'bookingVolume' => $bookingVolume,
        ]);
    }
}