<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoomRequest;
use App\Models\RoomCategory;
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
        // 1. Fetch Categories (Required for Create/Edit modals)
        $categories = RoomCategory::all(['id', 'room_category', 'price']);

        // 2. Fetch Rooms
        $rooms = Rooms::with('roomCategory') // Eager load category
            ->latest()
            ->get()
            ->map(function ($room) {
                return [
                    'id' => $room->id,
                    'room_categories_id' => $room->room_categories_id,
                    'room_name' => $room->room_name,
                    'room_description' => $room->room_description,

                    // --- FIX FOR THE CRASH IS HERE ---
                    // We map the category price to 'room_price' because that is likely 
                    // what your RoomDescription component expects for .toLocaleString()
                    'room_price' => $room->roomCategory ? (float) $room->roomCategory->price : 0,

                    'category_name' => $room->roomCategory ? $room->roomCategory->room_category : 'N/A',
                    'max_extra_person' => $room->max_extra_person,
                    'room_amenities' => $room->room_amenities,
                    'type_of_bed' => $room->type_of_bed,
                    'status' => $room->status,
                    'img_url' => $room->img_url,
                    'img_full_path' => $room->img_url
                        ? asset('storage/' . $room->img_url)
                        : asset('images/placeholder.png'),
                ];
            });

        return inertia('rooms/DisplayRoom', [
            'rooms' => $rooms,
            'categories' => $categories
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $categories = RoomCategory::all(['id', 'room_category', 'price']);
        return Inertia::render('rooms/RoomPage', ['categories' => $categories]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RoomRequest $request, RoomServices $roomServices)
    {
        $data = $request->validated();
        $data['user_id'] = Auth::id();

        $roomServices->createRoom($data);

        return redirect()->route('rooms.index')->with('success', 'Room created successfully.');
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

        // Prevent overwriting image with null if no file was uploaded
        if (array_key_exists('img_url', $data) && is_null($data['img_url'])) {
            unset($data['img_url']);
        }

        $roomServices->update($room, $data);

        return redirect()->back()->with('success', 'Room updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Rooms $room, RoomServices $services)
    {

        if ($room->reservations()->exists()) {
            return redirect()->back()->withErrors([
                'error' => 'Cannot delete this room because it has existing reservations.'
            ]);
        }

        $services->deleteRoom($room); // Your existing delete logic

        return redirect()->route('rooms.index')->with('success', 'Room deleted successfully.');
    }
}