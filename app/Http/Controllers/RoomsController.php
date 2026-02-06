<?php

namespace App\Http\Controllers;

use App\Enum\roles;
use App\Http\Requests\RoomRequest;
use App\Models\RoomCategory;
use App\Models\Rooms;
use App\Http\Controllers\Controller;
use App\Services\RoomServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class RoomsController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    private function authorizeManager()
    {
        if (!Gate::allows('manage-rooms')) {
            // We use ->send() here to force the redirect immediately 
            // from within this helper method.
            return redirect()->route('error')->send();
        }
    }
    public function index()
    {
        // 1. Fetch Categories (Lean Select)
        $categories = RoomCategory::select('id', 'room_category', 'price')->get();

        // 2. Fetch Rooms with optimized columns and eager loading
        $rooms = Rooms::query()
            ->select([
                'id',
                'room_categories_id',
                'room_name',
                'room_description',
                'max_extra_person',
                'room_amenities',
                'type_of_bed',
                'status',
                'img_url'
            ])
            ->with(['roomCategory:id,room_category,price']) // Only fetch needed category fields
            ->latest()
            ->get()
            ->map(function ($room) {
                // Transform for Frontend
                return [
                    'id' => $room->id,
                    'room_categories_id' => $room->room_categories_id,
                    'room_name' => $room->room_name,
                    'room_description' => $room->room_description,
                    'room_price' => $room->roomCategory ? (float) $room->roomCategory->price : 0,
                    'category_name' => $room->roomCategory ? $room->roomCategory->room_category : 'N/A',
                    'max_extra_person' => $room->max_extra_person,
                    'room_amenities' => $room->room_amenities,
                    'type_of_bed' => $room->type_of_bed,
                    'status' => $room->status,
                    'img_full_path' => $room->img_url ?: 'https://placehold.co/600x400?text=No+Room+Image',
                ];
            });

        return Inertia::render('rooms/DisplayRoom', [
            'rooms' => $rooms,
            'categories' => $categories
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Only fetch what the dropdown needs
        $this->authorizeManager();
        $categories = RoomCategory::select('id', 'room_category', 'price')->get();
        return Inertia::render('rooms/RoomPage', ['categories' => $categories]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RoomRequest $request, RoomServices $roomServices)
    {
        // Check if the user is NEITHER Admin NOR Super Admin
        $this->authorizeManager();

        // If they pass the check, proceed with creation
        $data = $request->validated();
        $data['user_id'] = Auth::id();

        $roomServices->createRoom($data);

        return redirect()->route('rooms.index')->with('success', 'Room created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RoomRequest $request, RoomServices $roomServices, Rooms $room)
    {
        $this->authorizeManager();
        $data = $request->validated();

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
        $this->authorizeManager();
        // Efficient Check: Don't load all reservations, just check existence
        if ($room->reservations()->exists()) {
            return redirect()->back()->withErrors([
                'error' => 'Cannot delete this room because it has existing reservations.'
            ]);
        }

        $services->deleteRoom($room);

        return redirect()->route('rooms.index')->with('success', 'Room deleted successfully.');
    }
}