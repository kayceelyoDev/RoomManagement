<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rooms extends Model
{
    //
   protected $fillable = [
        'room_categories_id',
        'room_name',
        'room_description',
        'img_url',
        'max_extra_person',
        'room_amenities',
        'type_of_bed',
        'status',
        'user_id',
    ];

    public function roomCategory()
    {
        return $this->belongsTo(RoomCategory::class, 'room_categories_id');
    }

    /**
     * Get the user who created/manages the room.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reservations()
    {
        // Explicitly define 'room_id' as the foreign key
        return $this->hasMany(Reservation::class, 'room_id');
    }
}
