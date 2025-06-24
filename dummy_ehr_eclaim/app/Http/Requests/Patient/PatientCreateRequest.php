<?php

namespace App\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;

class PatientCreateRequest extends FormRequest
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
            'customer_id' => 'required|exists:customers,id|unique:patients,customer_id',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'blood_group' => 'nullable|string|max:10',
            'allergies' => 'nullable|string',
            'chronic_diseases' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'insurance_provider' => 'nullable|string|max:255',
            'insurance_policy_number' => 'nullable|string|max:255',
            'insurance_expiry_date' => 'nullable|date',
        ];
    }
}
