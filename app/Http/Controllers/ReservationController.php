<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReservationRequest;
use App\Models\Reservation;
use App\Services\ReservationServices;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class ReservationController extends Controller
{
	/**
	 * Display the Admin Reservation Dashboard.
	 */
	public function index(Request $request, ReservationServices $services): Response|RedirectResponse
	{
		Gate::authorize('manage-reservations');

		return Inertia::render('reservations/ReservationPage', [
			'filters' => $request->only(['search']),
			'reservations' => fn() => $services->getPaginatedReservations($request->only('search')),
			'stats' => fn() => $services->getDashboardStats(),
			'rooms' => fn() => $services->getRoomsForAdmin(),
			'services' => fn() => $services->getServicesForAdmin(),
		]);
	}

	public function store(ReservationRequest $request, ReservationServices $services): RedirectResponse
	{
		// Pass the data to the service
		$services->createReservation($request->validated(), $request->ip());

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

	public function destroy(Reservation $reservation, ReservationServices $services): RedirectResponse
	{
		Gate::authorize('manage-reservations');

		try {
			$services->deleteReservation($reservation);

			return redirect()->back()->with('success', 'Reservation deleted.');
		} catch (\Exception $e) {
			Log::error("Error deleting reservation #{$reservation->id}: " . $e->getMessage());
			return redirect()->back()->with('error', 'Failed to delete reservation.');
		}
	}
}
