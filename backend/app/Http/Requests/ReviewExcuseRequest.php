<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewExcuseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // ExcuseRequestPolicy::review is checked in the controller.
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'teacher_remarks' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'teacher_remarks.required' => 'Please add a remark explaining your decision.',
        ];
    }
}
