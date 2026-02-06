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
        // LAZY LOADING: Ensures queries only run when specifically requested via partial reload
        return Inertia::render('dashboard', [
            'stats' => fn() => $this->getOperationalStats(),
            'roomStatus' => fn() => $this->getRoomStatus(),
            'guestMovements' => fn() => $this->getGuestMovements(),
            'bookingVolume' => fn() => $this->getBookingVolume(),
        ]);
    }

    public function analytics()
    {
        return Inertia::render('AnalyticsPage', [
            'revenueData' => fn() => $this->getRevenueData(),
            'categoryPerformance' => fn() => $this->getCategoryPerformance(),
            'topRooms' => fn() => $this->getTopRooms(),
            'reservationStatus' => fn() => $this->getReservationStatus(),
            'avgStay' => fn() => $this->getAvgStay(),
        ]);
    }

    // --- PRIVATE HELPER METHODS (PostgreSQL Compatible) ---

    private function getOperationalStats()
    {
        $today = Carbon::today();
        $totalRooms = Rooms::count();
        $occupiedCount = Rooms::where('status', 'occupied')->count();
        $unavailableCount = Rooms::where('status', 'unavailable')->count();

        return [
            'occupancy_rate' => $totalRooms > 0 ? round(($occupiedCount / $totalRooms) * 100) : 0,
            'arrivals_today' => Reservation::whereDate('check_in_date', $today)
                ->whereIn('status', [ReservationEnum::Confirmed, ReservationEnum::Pending])
                ->count(),
            'departures_today' => Reservation::whereDate('check_out_date', $today)
                ->where('status', ReservationEnum::CheckedIn)
                ->count(),
            'maintenance_count' => $unavailableCount,
        ];
    }

    private function getRoomStatus()
    {
        $occupiedCount = Rooms::where('status', 'occupied')->count();
        $unavailableCount = Rooms::where('status', 'unavailable')->count();

        return [
            'available' => Rooms::where('status', 'available')->count(),
            'booked' => Rooms::where('status', 'booked')->count(),
            'occupied' => $occupiedCount,
            'unavailable' => $unavailableCount,
        ];
    }

    private function getGuestMovements()
    {
        $today = Carbon::today();

        return Reservation::with('room:id,room_name')
            ->where(function ($q) use ($today) {
                $q->whereDate('check_in_date', $today)
                    ->orWhereDate('check_out_date', $today);
            })
            ->where('status', '!=', ReservationEnum::Cancelled)
            ->orderBy('check_in_date', 'asc')
            ->get();
    }

    private function getBookingVolume()
    {
        // FIXED: PostgreSQL uses CAST(col AS DATE) instead of DATE(col)
        return Reservation::select(
            DB::raw('CAST(check_in_date AS DATE) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->whereDate('check_in_date', '>=', now())
            ->whereDate('check_in_date', '<=', now()->addDays(7))
            ->groupBy('date')
            ->get();
    }

    private function getRevenueData()
    {
        $now = Carbon::now();
        $thirtyDaysAgo = Carbon::now()->subDays(30);
        $sixtyDaysAgo = Carbon::now()->subDays(60);

        $currentRevenue = Transaction::whereBetween('created_at', [$thirtyDaysAgo, $now])->sum('payment_amount');
        $previousRevenue = Transaction::whereBetween('created_at', [$sixtyDaysAgo, $thirtyDaysAgo])->sum('payment_amount');

        $revenueGrowth = $previousRevenue > 0
            ? round((($currentRevenue - $previousRevenue) / $previousRevenue) * 100, 1)
            : ($currentRevenue > 0 ? 100 : 0);

        // FIXED: PostgreSQL uses CAST(col AS DATE)
        $revenueTrend = Transaction::whereBetween('created_at', [$thirtyDaysAgo, $now])
            ->select(
                DB::raw('CAST(created_at AS DATE) as date'),
                DB::raw('SUM(payment_amount) as revenue'),
                DB::raw('COUNT(*) as bookings')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'trend' => $revenueTrend,
            'total' => $currentRevenue,
            'growth' => $revenueGrowth
        ];
    }

    private function getCategoryPerformance()
    {
        return Reservation::join('rooms', 'reservations.room_id', '=', 'rooms.id')
            ->join('room_categories', 'rooms.room_categories_id', '=', 'room_categories.id')
            ->select(
                'room_categories.room_category as name',
                DB::raw('COUNT(reservations.id) as count'),
                DB::raw('SUM(reservations.reservation_amount) as total')
            )
            ->where('reservations.status', '!=', ReservationEnum::Cancelled)
            ->groupBy('room_categories.room_category')
            ->orderByDesc('total')
            ->get();
    }

    private function getTopRooms()
    {
        return Reservation::join('rooms', 'reservations.room_id', '=', 'rooms.id')
            ->select(
                'rooms.room_name',
                DB::raw('COUNT(reservations.id) as bookings'),
                DB::raw('SUM(reservations.reservation_amount) as earned'),
             
                DB::raw('AVG(CAST(reservations.check_out_date AS DATE) - CAST(reservations.check_in_date AS DATE)) as avg_stay')
            )
            ->where('reservations.status', '!=', ReservationEnum::Cancelled)
            ->groupBy('rooms.id', 'rooms.room_name')
            ->orderByDesc('earned')
            ->take(5)
            ->get();
    }

    private function getReservationStatus()
    {
        return Reservation::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();
    }

    private function getAvgStay()
    {
       
        $val = Reservation::where('status', ReservationEnum::CheckedOut)
            ->select(DB::raw('AVG(CAST(check_out_date AS DATE) - CAST(check_in_date AS DATE)) as days'))
            ->value('days');

        return round($val ?? 0, 1);
    }
}