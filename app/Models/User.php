<?php

namespace App\Models;

use App\Enum\roles;
use App\Notifications\CustomVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role'=> roles::class,
        ];
    }

    public function sendEmailVerificationNotification(){
        $this->notify(new CustomVerifyEmail());
    }

    // --- RELATIONSHIPS (FIXED) ---

    // Changed from belongsToMany to hasMany
    // This assumes the 'rooms' table has a 'user_id' column (creator/manager)
    public function rooms(){
        return $this->hasMany(Rooms::class);
    }
    
    // Changed from belongsToMany to hasMany
    // This assumes 'reservations' table has 'user_id'
    public function reservations(){
        return $this->hasMany(Reservation::class);
    }

    // Changed from belongsToMany to hasMany
    public function checkins(){
        return $this->hasMany(CheckIn::class);
    }

    // Changed from belongsToMany to hasMany
    public function checkouts(){
        return $this->hasMany(Checkout::class);
    }

    // Correctly set as hasMany
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    // --- ROLE HELPERS ---

    public function isAdmin(){
        return $this->role === roles::ADMIN;
    }

    public function isStaff(){
        return $this->role === roles::STAFF;
    }

    public function isSupperAdmin(){
        return $this->role === roles::SUPPERADMIN;
    }

    public function isGuest(){
        return $this->role === roles::GUEST;
    }
}