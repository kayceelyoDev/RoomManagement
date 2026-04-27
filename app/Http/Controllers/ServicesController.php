<?php

namespace App\Http\Controllers;

use App\Models\Services;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule; // Needed for unique checks
use Inertia\Inertia;

class ServicesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Optimization: Select specific columns
        $services = Services::select('id', 'services_name', 'services_price')
            ->latest()
            ->get();

        return Inertia::render('roomServices/AddRoomServices', [
            'services' => $services
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'services_name' => ['required', 'string', 'max:255', 'unique:services,services_name'],
            'services_price' => ['required', 'numeric', 'min:0'],
        ]);

        Services::create($validated);

        return redirect()->route('services.index')->with('success', 'Service created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Services $service)
    {
        $validated = $request->validate([
            'services_name' => [
                'required', 
                'string', 
                'max:255', 
                // Ignore current ID for unique check
                Rule::unique('services', 'services_name')->ignore($service->id)
            ],
            'services_price' => ['required', 'numeric', 'min:0'],
        ]);

        $service->update($validated);

        return redirect()->back()->with('success', 'Service updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Services $service)
    {
        // Only block deletion if there are ACTIVE reservations (pending, confirmed, checked_in)
        // Allow deletion if reservations are cancelled or checked_out
        $activeStatuses = ['pending', 'confirmed', 'checked_in'];
        if ($service->reservations()->whereIn('status', $activeStatuses)->exists()) {
            return redirect()->back()->withErrors([
                'error' => 'Cannot delete this service because it is part of active reservations.'
            ]);
        }

        $service->delete();

        return redirect()->back()->with('success', 'Service deleted successfully.');
    }
}