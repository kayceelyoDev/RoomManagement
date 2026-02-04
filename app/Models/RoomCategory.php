<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoomCategory extends Model
{
    //
    protected $fillable = [
        'room_category',
        'price',
        'room_capacity',
    ];

    public function rooms()
    {
        return $this->hasMany(Rooms::class, 'room_categories_id');
    }
}
