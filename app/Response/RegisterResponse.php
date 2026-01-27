<?php

namespace App\Http\Responses;


use App\Enum\roles;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request)
    {
        $user = Auth::user();

        // 1. If the new user is a Guest, send to guest page
        if ($user->role === roles::GUEST) {
            return redirect()->route('guest');
        }

        // 2. Everyone else goes to Dashboard
        return redirect()->intended(route('dashboard'));
    }
}