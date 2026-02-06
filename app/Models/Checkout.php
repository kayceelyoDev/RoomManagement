<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Checkout extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'reservation_id',
        'user_id',
        'remarks',
    ];

    /**
     * Get the reservation associated with this checkout.
     */
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    /**
     * Get the staff member (user) who processed this checkout.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
