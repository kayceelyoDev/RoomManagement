<?php

namespace App\Http\Requests;

use App\Rules\Recaptcha;
use Illuminate\Foundation\Http\FormRequest;

class ReservationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }


    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $user = $this->user();
        $isGuest = $user?->role === 'guest';

        $rules = [
            // 1. Basic Reservation Details
            'room_id' => ['required', 'exists:rooms,id'],
            'contact_number' => ['required', 'digits:11'],
            'guest_email' => ['nullable', 'email'],
            'total_guest' => ['required', 'integer', 'min:1'],
            'guest_name' => ['required'],

            // 2. Date Logic
            'check_in_date' => ['required', 'date'],
            'check_out_date' => ['required', 'date', 'after:check_in_date'],

            // 3. Status & Amount
            'status' => ['required', 'in:pending,confirmed,cancelled,checked_in,checked_out'],
            'reservation_amount' => ['required', 'numeric', 'min:0'],

            // 4. Services
            'selected_services' => ['nullable', 'array'],
            'selected_services.*.id' => ['required', 'exists:services,id'],
            'selected_services.*.quantity' => ['required', 'integer', 'min:1'],
            'selected_services.*.price' => ['required', 'numeric', 'min:0'],
        ];

        // Only require CAPTCHA for guests
        if ($isGuest) {
            $rules['g-recaptcha-response'] = ['required', new Recaptcha()];
        }

        return $rules;
    }

    /**
     * Custom messages for specific errors
     */
    public function messages(): array
    {
        return [
            'check_out_date.after' => 'The check-out date must be after the check-in date.',
            'room_id.exists' => 'The selected room is invalid.',
            'selected_services.*.id.exists' => 'One of the selected services is invalid.',
            'g-recaptcha-response.required' => 'Please complete the reCAPTCHA challenge to verify you are a human.',
        ];
    }
}
