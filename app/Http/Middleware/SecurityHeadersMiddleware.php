<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Security headers to prevent clickjacking, MIME sniffing, and XSS attacks
        if (method_exists($response, 'header')) {
            // Prevent Clickjacking (iframe embedding attacks)
            $response->header('X-Frame-Options', 'SAMEORIGIN');

            // Prevent MIME type sniffing
            $response->header('X-Content-Type-Options', 'nosniff');

            // Enable basic cross-site scripting filter
            $response->header('X-XSS-Protection', '1; mode=block');

            // Tell browsers to ONLY connect via HTTPS for the next year
            $response->header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

            // Control how much referrer information is sent across site origin boundaries
            $response->header('Referrer-Policy', 'strict-origin-when-cross-origin');
        }

        return $response;
    }
}
