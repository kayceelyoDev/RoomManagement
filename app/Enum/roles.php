<?php

namespace App\Enum;

enum roles : string
{
    //
    case ADMIN = 'admin';
    case SUPPERADMIN = 'supperAdmin';
    case STAFF = 'staff';
    case GUEST = 'guest';
}
