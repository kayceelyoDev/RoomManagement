<?php

namespace App\Http\Requests;

use File;
use Illuminate\Foundation\Http\FormRequest;

class RoomRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            //
            'room_categories_id' => ['required', 'exists:room_categories,id'],

            'room_name' => ['required', 'string', 'max:255'],
            'room_description' => ['required', 'string'],
            'max_extra_person' => ['required', 'integer'],
            'room_amenities' => ['required', 'string'],
            'type_of_bed' => ['required', 'string'],
            'status' => ['required', 'in:available,booked,occupied,unavailable'],
            'img_url' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:20048', 
        ];
    }
}
