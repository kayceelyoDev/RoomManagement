<?php

namespace App\Providers;

use App\Enum\roles;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Gate::define('acces-admin',function(User $user){
        //     return $user->role === roles::ADMIN;
        // });

        // Gate::define('acces-staff',function(User $user){
        //     return $user->role === roles::STAFF;
        // });

        // Gate::define('acces-supperAdmin',function(User $user){
        //     return $user->role === roles::SUPPERADMIN;
        // });

        // Gate::define('view-room-management', function(User $user){
        //     return in_array($user->role,[
        //         roles::ADMIN,
        //         roles::SUPPERADMIN,
        //     ]); 
        // });

        // Gate::define('access-dashboard',function(User $user){
        //     return  in_array($user->role,[
        //         roles::ADMIN,
        //         roles::STAFF,
        //         roles::SUPPERADMIN,
        //     ]);
        // });

        Gate::define('manage-rooms', function (User $user) {
            return in_array($user->role, [
                roles::ADMIN,
                roles::SUPPERADMIN,
            ]);
        });

        Gate::define('manage-reservations', function (User $user) {
            return in_array($user->role, [
                roles::ADMIN,
                roles::SUPPERADMIN,
                roles::STAFF,
            ]);
        });

       Gate::define('manage-user', function (User $user) {
           
            $userRole = $user->role instanceof roles ? $user->role->value : $user->role;

            // Now compare the strings safely
            return strtolower($userRole) === strtolower(roles::SUPPERADMIN->value);
        });

        // Keep your guest gate if needed
        Gate::define('acces-guest', function (User $user) {
            return $user->role === roles::GUEST;
        });
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn(): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
