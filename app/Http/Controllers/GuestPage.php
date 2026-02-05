<?php

namespace App\Http\Controllers;

use App\Enum\ReservationEnum;
use App\Mail\ReservationCancellationMain;
use App\Models\Reservation;
use App\Models\Rooms;
use App\Models\Services;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Laravel\Fortify\Features;

class GuestPage extends Controller
{
    /**
     * Public Welcome Page
     */
    public function getRooms()
    {
        $rooms = Rooms::latest()
            // FIXED: Changed 'room_category_id' to 'room_categories_id'
            ->select('id', 'room_name', 'room_categories_id', 'img_url', 'max_extra_person', 'status')
            ->with([
                'roomCategory:id,room_category,price,room_capacity',
                'reservations' => fn($q) => $q->where('check_out_date', '>=', now())
                    ->select('id', 'room_id', 'check_in_date', 'check_out_date', 'status')
            ])
            ->where('status', '!=', 'maintenance')
            ->get();

        return Inertia::render('welcome', [
            'rooms' => $rooms,
            'canRegister' => Features::enabled(Features::registration()),
        ]);
    }

    /**
     * Protected Guest Dashboard Room List
     */
    public function guestPageRooms()
    {
        if (!Gate::allows('acces-guest')) {
            return redirect()->route('error')->with('error', 'Guests only!');
        }

        $rooms = Rooms::query()
            // FIXED: Changed 'room_category_id' to 'room_categories_id'
            ->select('id', 'room_name', 'room_categories_id', 'img_url', 'max_extra_person', 'status')
            ->with([
                'roomCategory:id,room_category,price,room_capacity',
                'reservations' => fn($q) => $q->where('check_out_date', '>=', now())
                    ->select('id', 'room_id', 'check_in_date', 'check_out_date', 'status')
            ])
            ->where('status', '!=', 'maintenance')
            ->latest()
            ->get();

        $services = Services::select('id', 'services_name', 'services_price')->get();

        return Inertia::render('GuestPage', [
            'rooms' => $rooms,
            'services' => $services,
            'auth' => ['user' => Auth::user()]
        ]);
    }

    /**
     * User's Reservation History
     */
    public function myReservations()
    {
        $userId = Auth::id();

        // Columns to fetch
        $columns = ['id', 'user_id', 'room_id', 'check_in_date', 'check_out_date', 'status', 'reservation_amount', 'created_at', 'updated_at'];

        // 1. Fetch Active Reservations (Unlimited)
        $active = Reservation::where('user_id', $userId)
            ->whereIn('status', [
                ReservationEnum::Pending,
                ReservationEnum::Confirmed,
                ReservationEnum::CheckedIn
            ])
            ->select($columns)
            ->with([
                // FIXED: Ensure we fetch room_categories_id if needed, otherwise standard relation is fine
                'room:id,room_name,room_categories_id,img_url', 
                'room.roomCategory:id,room_category',
                'services:id,services_name'
            ])
            ->latest()
            ->get();

        // 2. Fetch History/Cancelled (Limit 5)
        $inactive = Reservation::where('user_id', $userId)
            ->whereIn('status', [
                ReservationEnum::Cancelled,
                ReservationEnum::CheckedOut,
                // ReservationEnum::Completed // Add this if you have a completed status
            ])
            ->select($columns)
            ->with([
                'room:id,room_name,room_categories_id,img_url',
                'room.roomCategory:id,room_category',
                'services:id,services_name'
            ])
            ->latest()
            ->take(5)
            ->get();

        // Merge and prepare for frontend
        $reservations = $active->merge($inactive)->values();

        return Inertia::render('GuestReservationPage', [
            'reservations' => $reservations,
            'notifications' => $this->generateNotifications($reservations),
            'user' => Auth::user()
        ]);
    }

    /**
     * Cancel Reservation Logic
     */
    public function cancel(Request $request, Reservation $reservation)
    {
        if ($request->user()->id !== $reservation->user_id) {
            abort(403);
        }

        if (!in_array($reservation->status, [ReservationEnum::Pending, ReservationEnum::Confirmed])) {
            return back()->with('error', 'This reservation cannot be cancelled.');
        }

        try {
            DB::transaction(function () use ($reservation) {
                $reservation->update(['status' => ReservationEnum::Cancelled]);
            });

            if ($reservation->user && $reservation->user->email) {
                try {
                    Mail::to($reservation->user->email)->queue(new ReservationCancellationMain($reservation));
                } catch (\Throwable $e) {
                    Log::error("Mail queue error for Res #{$reservation->id}: " . $e->getMessage());
                }
            }

            Log::info("Reservation #{$reservation->id} cancelled by User #{$request->user()->id}");

            return back()->with('success', 'Reservation cancelled successfully.');

        } catch (\Exception $e) {
            Log::error("Cancel Error #{$reservation->id}: " . $e->getMessage());
            return back()->with('error', 'System error. Please try again later.');
        }
    }

    /**
     * Helper to generate UI notifications
     */
    private function generateNotifications($reservations)
    {
        $notifications = [];

        foreach ($reservations as $res) {
            if ($res->status === ReservationEnum::Pending) {
                $deadline = $res->created_at->addHours(2);
                if (now()->lt($deadline)) {
                    $minutes = now()->diffInMinutes($deadline);
                    $notifications[] = [
                        'id' => 'verify-' . $res->id,
                        'type' => 'warning',
                        'title' => 'Verification Required',
                        'message' => "Verify booking #{$res->id} via email within {$minutes} mins."
                    ];
                }
            }

            if ($res->status === ReservationEnum::Confirmed) {
                if ($res->check_in_date->isFuture() && $res->check_in_date->diffInDays(now()) <= 3) {
                    $notifications[] = [
                        'id' => 'upcoming-' . $res->id,
                        'type' => 'success',
                        'title' => 'Upcoming Stay',
                        'message' => "Your stay at {$res->room->room_name} starts " . $res->check_in_date->diffForHumans() . "."
                    ];
                }
            }

            if ($res->status === ReservationEnum::Cancelled && $res->updated_at->diffInHours(now()) < 24) {
                $notifications[] = [
                    'id' => 'cancelled-' . $res->id,
                    'type' => 'info',
                    'title' => 'Cancelled',
                    'message' => "Booking #{$res->id} was cancelled."
                ];
            }
        }

        return $notifications;
    }
}