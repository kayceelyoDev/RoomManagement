<?php

namespace App\enum;

enum ReservationEnum : string
{
    //
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';
    case CheckedIn = 'checked_in';
    case CheckedOut = 'checked_out';
}
