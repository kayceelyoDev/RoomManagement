<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoomRequest;
use App\Models\Rooms;
use App\Http\Controllers\Controller;
use App\Services\RoomServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RoomsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $rooms = Rooms::latest()
            ->get()
            ->map(function ($room) {
                return [
                    'id' => $room->id,
                    'room_name' => $room->room_name,
                    'room_description' => $room->room_description,
                    'room_price' => (float) $room->room_price,
                    'status' => $room->status,
                    'user_id' => $room->user_id,
                    // Ensure image URL is always a full public path
                    'img_url' => $room->img_url
                        ? asset('storage/' . $room->img_url)
                        : asset('images/placeholder.png'),
                ];
            });

        return inertia('rooms/DisplayRoom', [
            'rooms' => $rooms
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
        return Inertia::render('rooms/RoomPage');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RoomRequest $roomrequest, RoomServices $roomServices)
    {

        $rooms = $roomrequest->validated();
        $rooms['user_id'] = Auth::id();
        $path = null;
        if ($roomrequest->hasFile('img_url')) {
            $path = $roomrequest->file('img_url')->store('room', 'public');
        }
        $rooms['img_url'] = $path;

        $roomServices->createRoom($rooms);

        return redirect()->route('rooms.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(Rooms $rooms)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Rooms $rooms)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RoomRequest $roomrequest, RoomServices $roomServices, Rooms $room)
    {
        $data = $roomrequest->validated();


        $data['user_id'] = Auth::id();



        if (isset($data['img_url']) && $data['img_url'] instanceof \Illuminate\Http\UploadedFile) {

            $data['img_url'] = $data['img_url']->store('room', 'public');
        } else {

            unset($data['img_url']);
        }

        $roomServices->update($room, $data);

        return redirect()->back()->with('success', 'Room updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Rooms $rooms)
    {
        //
    }
}
