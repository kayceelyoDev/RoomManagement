<?php

namespace App\Http\Controllers;

use App\Enum\ReservationEnum;
use App\Enum\roles;
use App\Http\Requests\ReservationRequest;
use App\Models\Reservation;
use App\Models\Rooms;
use App\Models\Services;
use App\Services\ReservationServices;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class ReservationController extends Controller
{
	/**
	 * Display the Admin Reservation Dashboard.
	 */
	public function index(Request $request): Response|RedirectResponse
	{
		Gate::authorize('manage-reservations');

		return Inertia::render('reservations/ReservationPage', [
			'filters' => $request->only(['search']),
			'reservations' => fn(): LengthAwarePaginator => $this->getReservations($request),
			'stats' => fn(): array => $this->getStats(),
			'rooms' => fn(): \Illuminate\Database\Eloquent\Collection => Rooms::select('id', 'room_name', 'room_categories_id', 'max_extra_person', 'status')
				->with([
					'roomCategory',
					'reservations' => fn($query) => $query->select('id', 'room_id', 'check_in_date', 'check_out_date', 'status')
						->where('status', '!=', ReservationEnum::Cancelled->value)
						->whereDate('check_out_date', '>=', now()->toDateString())
				])
				->get(),
			'services' => fn(): \Illuminate\Database\Eloquent\Collection => Services::select('id', 'services_name', 'services_price')->get(),
		]);
	}

	private function getReservations(Request $request): LengthAwarePaginator
	{
		$search = $request->input('search');

		return Reservation::query()
			->with([
				'room:id,room_name,room_categories_id',
				'services:id,services_name'
			])
			->when($search, function ($query, string $term) {
				$searchTerm = '%' . strtolower($term) . '%';
				$query->where(function ($q) use ($searchTerm, $term) {
					$q->whereRaw('LOWER(guest_name) LIKE ?', [$searchTerm])
						->orWhere('contact_number', 'like', "%{$term}%")
						->orWhereHas('room', fn($subQ) => $subQ->whereRaw('LOWER(room_name) LIKE ?', [$searchTerm]));
				});
			})
			->latest()
			->paginate(10)
			->withQueryString();
	}

	private function getStats(): array
	{
		$today = Carbon::today();

		$aggregates = Reservation::toBase()
			->selectRaw("SUM(CASE WHEN status != ? THEN reservation_amount ELSE 0 END) as total_revenue", [ReservationEnum::Cancelled->value])
			->selectRaw("COUNT(CASE WHEN status = ? THEN 1 END) as pending_count", [ReservationEnum::Pending->value])
			->first();

		$arrivals = Reservation::query()
			->whereDate('check_in_date', $today)
			->where('status', '!=', ReservationEnum::Cancelled->value)
			->count();

		$departures = Reservation::query()
			->whereDate('check_out_date', $today)
			->where('status', '!=', ReservationEnum::Cancelled->value)
			->count();

		return [
			'total_revenue' => (float) ($aggregates->total_revenue ?? 0),
			'arrivals_today' => (int) $arrivals,
			'departures_today' => (int) $departures,
			'pending_count' => (int) ($aggregates->pending_count ?? 0),
		];
	}

	public function store(ReservationRequest $request, ReservationServices $services): RedirectResponse
	{
		$data = $request->validated();
		$user = Auth::user();
		$data['user_id'] = $user?->id; // Records who made the booking in the system

		// If a guest is using the app, overwrite the email with their secure account email
		if (Gate::allows('acces-guest')) {
			$data['guest_email'] = $user?->email;
		}

		$key = 'reservation-create:' . ($user?->id ?: $request->ip());

		if (RateLimiter::tooManyAttempts($key, 3)) {
			$seconds = RateLimiter::availableIn($key);
			return redirect()->back()->with('error', "Too many reservation attempts. Please try again in {$seconds} seconds.");
		}

		RateLimiter::hit($key, 60); // Increment counter, expires in 60 seconds

		// Pass the data to the service
		$services->createReservation($data);

		// Redirect appropriately based on role authorization
		if (Gate::allows('acces-guest')) {
			return redirect()->route('guest.guestpage')->with('success', 'Reservation created successfully.');
		}

		return redirect()->route('reservation.index')->with('success', 'Reservation created successfully.');
	}

	public function update(ReservationRequest $request, Reservation $reservation, ReservationServices $services): RedirectResponse
	{
		Gate::authorize('manage-reservations');

		$data = $request->validated();

		$services->updateReservation($reservation, $data);

		return redirect()->back()->with('success', 'Reservation updated successfully.');
	}

	public function destroy(Reservation $reservation): RedirectResponse
	{
		Gate::authorize('manage-reservations');

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
