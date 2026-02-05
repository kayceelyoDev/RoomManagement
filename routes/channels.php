<?php

use Illuminate\Support\Facades\Broadcast;

// --- AUTHORIZE RESERVATIONS CHANNEL ---
Broadcast::channel('reservations', function ($user) {
    // Return TRUE to let ANY logged-in user (admin, staff, super admin) listen.
    // If you return false or null, they will NOT receive updates.
    return !is_null($user); 
});

// (Keep your other channels if you have them)
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});