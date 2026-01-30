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
        //
        return Inertia::render('rooms/RoomPage');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RoomRequest $roomrequest, RoomServices $roomServices)
    {
        
        $rooms = $roomrequest->validated();
        $rooms['user_id']= Auth::id();
        $path = null;
        if($roomrequest->hasFile('img_url')){
        $path = $roomrequest->file('img_url')->store('room','public');
        }
        $rooms['img_url'] = $path;

        $roomServices->createRoom($rooms);
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
    public function update(Request $request, Rooms $rooms)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Rooms $rooms)
    {
        //
    }
}
