<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Reservation extends Model
{
    //
    use HasFactory, HasUlids;
    protected $fillable = [
        'user_id',
        'guest_name',
        'contact_number',
        'total_guest',
        'check_in_date',
        'check_out_date',
        'reservation_amount',
        'room_id',
        'status',
    ];

    protected $casts = [
        'check_in_date' => 'datetime',
        'check_out_date' => 'datetime',
    ];

    public function user() 
    {
        return $this->belongsTo(User::class);
    }

    public function room()
    {
        return $this->belongsTo(Rooms::class);
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Services::class, 'reservation_services', 'reservation_id', 'services_id')
                    ->withPivot('quantity', 'total_amount')
                    ->withTimestamps();
    }
}
