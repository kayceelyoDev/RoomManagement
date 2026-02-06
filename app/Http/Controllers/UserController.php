<?php

namespace App\Http\Controllers;

use App\Enum\roles;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        // 1. Security Gate (Throws 403 if false)
        Gate::authorize('manage-user');

        $search = $request->input('search');

        $users = User::query()
            ->select('id', 'name', 'email', 'role', 'created_at')
            // Filter strictly using Enum values
            ->whereIn('role', [
                roles::ADMIN->value,
                roles::SUPPERADMIN->value,
                roles::STAFF->value
            ])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('UserPage/UserPage', [
            'users' => $users,
            'filters' => ['search' => $search]
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-user');

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|in:' . implode(',', [
                roles::ADMIN->value,
                roles::STAFF->value,
                roles::SUPPERADMIN->value
            ]),
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'email_verified_at' => now(),
        ]);

        return redirect()->back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, $id)
    {
        // 1. Manual Lookup (Fixes binding issues)
        $user = User::findOrFail($id);

        // 2. Security Gate
        Gate::authorize('manage-user');

        // 3. Validate
        $validated = $request->validate([
            'role' => 'required|string|in:' . implode(',', [
                roles::ADMIN->value,
                roles::STAFF->value,
                roles::SUPPERADMIN->value
            ]),
        ]);

        // 4. Safety Check: Prevent Self-Demotion
        if ($user->id === auth()->id() && $validated['role'] !== roles::SUPPERADMIN->value) {
            return back()->withErrors(['role' => 'You cannot demote your own account status.']);
        }

        // 5. Update
        // We use tryFrom to ensure the string converts to the Enum correctly
        $user->role = roles::tryFrom($validated['role']);
        $user->save();

        return redirect()->back()->with('success', 'User role updated successfully.');
    }

    public function destroy($id)
    {
        // 1. Manual Lookup
        $user = User::findOrFail($id);

        // 2. Security Gate
        Gate::authorize('manage-user');

        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => 'You cannot delete your own account.']);
        }

        if ($user->role === roles::SUPPERADMIN) { // Strict comparison with Enum
            return back()->withErrors(['error' => 'Super Administrator accounts cannot be deleted.']);
        }

        $user->delete();

        return redirect()->back()->with('success', 'User removed successfully.');
    }
}