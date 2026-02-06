<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Transaction extends Model
{
    //
    protected $fillable = [
        'reservation_id',
        'payment_amount',
        'user_id',
    ];

    public function checkIn(): HasOne
    {
        return $this->hasOne(CheckIn::class);
    }

    /**
     * Get the user who processed the transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Note: Assuming you have a Reservation model for the ULID reference
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}
