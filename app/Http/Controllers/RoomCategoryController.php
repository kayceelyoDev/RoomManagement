<?php

namespace App\Http\Controllers;

use App\Models\RoomCategory;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // Don't forget to import Auth
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use App\Enum\roles; // Ensure your roles Enum is imported

class RoomCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    private function authorizeManager()
    {
        if (!Gate::allows('manage-rooms')) {
            return redirect()->route('error')->send();
        }
    }
    public function index()
    {
        // Authorization Check
       $this->authorizeManager();

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
        // Authorization Check
        $this->authorizeManager();

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
    public function update(Request $request, RoomCategory $roomcategory)
    {
        // Authorization Check
        $this->authorizeManager();

        $validated = $request->validate([
            'room_category' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'room_capacity' => ['required', 'integer', 'min:1'],
        ]);

        $roomcategory->update($validated);

        return redirect()->back()->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(RoomCategory $roomcategory)
    {
        // Authorization Check
        $this->authorizeManager();

        $roomcategory->delete();
        
        return redirect()->back()->with('success', 'Category deleted successfully.');
    }
}