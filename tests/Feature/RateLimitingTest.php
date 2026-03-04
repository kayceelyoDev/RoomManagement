<?php

namespace Tests\Feature;

use App\Models\User;
use App\Enum\roles;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 
     */

    #[DataProvider('rateLimitedRoutesProvider')]
    public function test_endpoints_are_rate_limited($routeName)
    {
        // 1. Create a super-user so we don't get blocked by Roles or Verification
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'role' => roles::ADMIN, // Assuming Admin has access to these routes
        ]);

        // Fast-forward time to ensure the rate limiter is completely reset for this iteration
        $this->travel(1)->minutes();

        // 2. Make 60 requests
        for ($i = 0; $i < 60; $i++) {
            $response = $this->actingAs($user)->get(route($routeName));
            
            // We assert it is NOT 429 (Too Many Requests) yet.
            // We use this instead of assertSuccessful() just in case a route returns
            // a 403 (unauthorized) or 302 (redirect) based on other logic.
            // We only care that the rate limiter hasn't kicked in yet.
            $this->assertNotEquals(429, $response->status(), "Rate limit hit too early on request $i for route $routeName");
        }

        // 3. The 61st request MUST fail with a 429 status
        $response = $this->actingAs($user)->get(route($routeName));
        
        $response->assertStatus(429);
    }

    /**
     * This provides the data to the test above. 
     * The test will run 4 times, once for each route in this array.
     */
    public static function rateLimitedRoutesProvider(): array
    {
        return [
            'Home Page'         => ['home'],
            'Dashboard'         => ['dashboard'],
            'Reservation Index' => ['reservation.index'],
            'Guest Page'        => ['guest.guestpage'],
            // Add any other simple GET route names here!
        ];
    }
}