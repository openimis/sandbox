<?php

namespace App\Http\Requests\Patient;

use App\Enums\Core\SortOrderEnum;
use App\Enums\Patient\PatientFiltersEnum;
use App\Enums\Patient\PatientSortFieldsEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PatientIndexRequest extends FormRequest
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
            PatientFiltersEnum::NAME->value => ['nullable', 'string', 'max:255'],
            PatientFiltersEnum::GENDER->value => ['nullable', Rule::in(['male', 'female', 'other'])],
            PatientFiltersEnum::BLOOD_GROUP->value => [
                'nullable',
                Rule::in(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
            ],
            PatientFiltersEnum::INSURANCE_PROVIDER->value => ['nullable', 'string', 'max:255'],
            PatientFiltersEnum::CREATED_AT->value => ['nullable', 'array', 'size:2'],
            PatientFiltersEnum::CREATED_AT->value . '.*' => ['nullable', 'date'],
            'sort_by' => [
                'nullable',
                Rule::in(array_keys(PatientSortFieldsEnum::choices())),
            ],
            'sort_order' => [
                'nullable',
                Rule::in(array_keys(SortOrderEnum::choices())),
            ],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'inertia' => ['nullable', 'string', 'in:enabled,disabled'],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            PatientFiltersEnum::NAME->value => $this->input(PatientFiltersEnum::NAME->value, null),
            PatientFiltersEnum::GENDER->value => $this->input(PatientFiltersEnum::GENDER->value, null),
            PatientFiltersEnum::BLOOD_GROUP->value => $this->input(PatientFiltersEnum::BLOOD_GROUP->value, null),
            PatientFiltersEnum::INSURANCE_PROVIDER->value => $this->input(PatientFiltersEnum::INSURANCE_PROVIDER->value, null),
            PatientFiltersEnum::CREATED_AT->value => $this->input(PatientFiltersEnum::CREATED_AT->value, null),
            'sort_by' => $this->input('sort_by', null),
            'sort_order' => $this->input('sort_order', null),
        ]);
    }
}