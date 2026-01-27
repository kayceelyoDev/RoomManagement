<?php

namespace App\Http\Responses;


use App\Enum\roles;
use Illuminate\Support\Facades\Auth;


class LoginResponse implements \Laravel\Fortify\Contracts\LoginResponse
{
    public function toResponse($request)
    {
        $user = Auth::user();

        // 1. If Guest, send to guest page immediately
        if ($user->role === roles::GUEST) {
            return redirect()->route('guest');
        }

        // 2. Everyone else (Admin/Staff) goes to Dashboard
        return redirect()->intended(route('dashboard'));
    }
}