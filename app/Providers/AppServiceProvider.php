<?php

namespace App\Providers;

use App\Enum\roles;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
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
        // Add Strict Model checking (Protects against mass assignment and lazy-loading bugs)
        // Automatically turns off in production, but guarantees you don't commit vulnerable queries locally.
        Model::shouldBeStrict(! app()->isProduction());

        Gate::define('manage-rooms', fn(User $user) => in_array($user->role, [
            roles::ADMIN,
            roles::SUPPERADMIN,
        ]));

        Gate::define('manage-reservations', fn(User $user) => in_array($user->role, [
            roles::ADMIN,
            roles::SUPPERADMIN,
            roles::STAFF,
        ]));

        Gate::define('manage-user', function (User $user) {
            $userRole = $user->role instanceof roles ? $user->role->value : $user->role;
            return strtolower((string) $userRole) === strtolower(roles::SUPPERADMIN->value);
        });

        Gate::define('access-analytics', fn(User $user) => $user->role === roles::SUPPERADMIN);

        Gate::define('acces-guest', fn(User $user) => $user->role === roles::GUEST);

        Password::defaults(function () {
            return Password::min(8)
                ->letters()
                ->mixedCase()
                ->numbers()
                ->symbols()
                ->uncompromised();
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
