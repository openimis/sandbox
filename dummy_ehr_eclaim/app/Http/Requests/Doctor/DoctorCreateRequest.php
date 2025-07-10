<?php

namespace App\Http\Requests\Doctor;

use Illuminate\Foundation\Http\FormRequest;

class DoctorCreateRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:doctors,email',
            'phone' => 'nullable|string|max:20',
            'specialization' => 'required|string|max:255',
            'qualifications' => 'nullable|string',
            'consultation_fee' => 'required|numeric|min:0',
            'bio' => 'nullable|string',
            'photo' => 'nullable|image|max:2048',
            'status' => 'required|in:active,inactive',
        ];
    }
}
