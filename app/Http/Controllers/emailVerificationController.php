<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use Illuminate\Http\Request;

class emailVerificationController extends Controller
{
    //
    public function verifyReservation(Request $request, $id)
    {
        // 1. Find the reservation
        $reservation = Reservation::findOrFail($id);

      
        if ($reservation->status === 'confirmed') {
            return view('reservation.success', ['message' => 'This reservation is already verified!']);
        }

        $reservation->update(['status' => 'confirmed']);

      
        return view('reservation.success');
    }
}
