<?php

namespace App\Http\Requests;

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
        return [
            // 1. Basic Reservation Details
            'room_id' => ['required', 'exists:rooms,id'], // Ensures the room actually exists
           'contact_number' => ['required', 'digits:11'],
            'total_guest' => ['required', 'integer', 'min:1'],
            'guest_name'=>['required'],
            
            // 2. Date Logic
            'check_in_date' => ['required', 'date'],
            'check_out_date' => ['required', 'date', 'after:check_in_date'], // Must be strictly AFTER check-in
            
            // 3. Status & Amount
            'status' => ['required', 'in:pending,confirmed,cancelled,completed'], // Restrict to valid statuses
            'reservation_amount' => ['required', 'numeric', 'min:0'],

            // 4. Services (The new array structure)
            // Expecting data like: selected_services: [{id: 1, quantity: 2, price: 500}, ...]
            'selected_services' => ['nullable', 'array'],
            
            // Validate each item INSIDE the array
            'selected_services.*.id' => ['required', 'exists:services,id'], // Service must exist in DB
            'selected_services.*.quantity' => ['required', 'integer', 'min:1'],
            'selected_services.*.price' => ['required', 'numeric', 'min:0'],
        ];
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
        ];
    }
}