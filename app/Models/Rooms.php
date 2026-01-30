<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rooms extends Model
{
    //
    protected $fillable = [
        'room_name',
        'room_description',
        'room_price',
        'img_url',
        'status',
        'user_id'
    ];

    public function user(){
        return $this->belongsTo(User::class);
    }

}
