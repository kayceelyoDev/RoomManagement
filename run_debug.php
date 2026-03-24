<?php
file_put_contents('debug.json', App\Models\Services::all()->toJson());
file_put_contents('debug_rooms.json', App\Models\Rooms::all()->toJson());
