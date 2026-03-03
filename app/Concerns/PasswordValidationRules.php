<?php

namespace App\Concerns;

use Illuminate\Validation\Rules\Password;

trait PasswordValidationRules
{
    /**
     * Get the validation rules used to validate passwords.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function passwordRules(): array
    {
        return ['required', 'string', Password::defaults(), 'confirmed'];
    }

    public function errorMessages(): array
    {
        $customMessage = 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.';
        
        return [
            'password.required' => 'The password field is required.',
            'password.string' => 'The password must be a string.',
            'password' => $customMessage,
            'password.min' => $customMessage,
            'password.letters' => $customMessage,
            'password.mixed_case' => $customMessage,
            'password.mixedCase' => $customMessage,
            'password.numbers' => $customMessage,
            'password.symbols' => $customMessage,
            'password.uncompromised' => $customMessage,
            'password.confirmed' => 'The password confirmation does not match.',
        ];
    }

    /**
     * Get the validation rules used to validate the current password.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function currentPasswordRules(): array
    {
        return ['required', 'string', 'current_password'];
    }
}
