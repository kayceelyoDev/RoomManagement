<?php

namespace App\Http\Controllers;

use App\Models\Services;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServicesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
   public function index()
    {
        // Fetch services
        $services = Services::latest()->get();

        // RENDER the Inertia View and pass the data
        // Ensure the path 'Services/AddRoomServices' matches your file structure in resources/js/Pages
        return Inertia::render('roomServices/AddRoomServices', [
            'services' => $services
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
        //
        $validated = $request->validate([
            'services_name' => ['required'],
            'services_price'=>['required']
        ]);

        $data = Services::create($validated);

        return redirect()->route('services.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(Services $services)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Services $services)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
   public function update(Request $request, Services $service)
    {
        $validated = $request->validate([
            'services_name' => 'required|string|max:255',
            'services_price' => 'required|numeric|min:0',
        ]);

        $service->update($validated);

        return redirect()->back()->with('success', 'Service updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Services $service)
    {
        $service->delete();

        return redirect()->back()->with('success', 'Service deleted successfully.');
    }
}
