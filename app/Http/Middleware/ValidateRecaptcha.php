<?php

namespace App\Http\Middleware;

use App\Rules\Recaptcha;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ValidateRecaptcha
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
        // Define routes that require explicit bot protection
        $protectedRoutes = [
            'login.store',
            'register.store',
            'password.email', // Forgot password email dispatch
            'password.update', // Resetting the password itself
        ];

        if ($request->isMethod('post') && in_array($request->route()?->getName(), $protectedRoutes)) {
            $validator = Validator::make($request->all(), [
                'g-recaptcha-response' => ['required', new Recaptcha()],
            ], [
                'g-recaptcha-response.required' => 'Please complete the reCAPTCHA challenge.',
            ]);

            if ($validator->fails()) {
                throw ValidationException::withMessages([
                    'g-recaptcha-response' => $validator->errors()->first('g-recaptcha-response')
                ]);
            }
        }

        return $next($request);
    }
}
