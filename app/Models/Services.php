<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Services extends Model
{
    protected $fillable = [
        'services_name',
        'services_price',

    ];

    public function reservations(): BelongsToMany
    {
        return $this->belongsToMany(Reservation::class, 'reservation_services', 'services_id', 'reservation_id')
                    ->withPivot('quantity', 'total_amount')
                    ->withTimestamps();
    }

}
