<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation_Services extends Model
{
    //
protected $table = 'reservation_services';
    protected $fillable = [
        'services_id',
        'quantity',
        'total_amount',
        'reservation_id',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Services::class, 'services_id');
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}
