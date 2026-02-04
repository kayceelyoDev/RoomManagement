<?php

namespace App\Http\Controllers;

use App\Models\RoomCategory;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Fetch categories sorted by latest
        $categories = RoomCategory::latest()->get();

        // Pass 'categories' prop to the frontend
        return Inertia::render('rooms/AddRoomCategory', [
            'categories' => $categories
        ]);
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
    public function store(Request $request)
    {
        $validated = $request->validate([
            'room_category' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'room_capacity' => ['required', 'integer', 'min:1'],
        ]);

        RoomCategory::create($validated);

        return redirect()->back()->with('success', 'Category created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(RoomCategory $roomCategory)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(RoomCategory $roomCategory)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
   public function update(Request $request, RoomCategory $roomCategory)
    {
        
        $validated = $request->validate([
            'room_category' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'room_capacity' => ['required', 'integer', 'min:1'],
        ]);

        // 2. Update
        $roomCategory->update($validated);

        return redirect()->back()->with('success', 'Category updated successfully.');
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(RoomCategory $roomCategory)
    {
       

        $roomCategory->delete();

        return redirect()->back()->with('success', 'Category deleted successfully.');
    }
}
