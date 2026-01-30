<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
   public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(["message" => "Unauthorized"], 401);
            }
            Log::warning('URL bypass', ["ip" => $request->ip()]);
            return redirect()->route('home');
        }

        $userRole = Auth::user()->role->value ?? null;
        $role = ['admin','staff','supperAdmin'];
        if (!in_array($userRole, $role, true)) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(["message" => "Forbidden"], 403);
            }
            Log::warning('Role restricted access', [
                "ip" => $request->ip(),
                "role" => $userRole,
                "required_roles" => $role,
            ]);
            return redirect()->route('error');
        }

        return $next($request);
    }
}
