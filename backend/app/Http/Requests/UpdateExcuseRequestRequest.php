<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExcuseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // ExcuseRequestPolicy::update is checked in the controller.
    }

    public function rules(): array
    {
        return [
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'category_id' => ['required', 'integer', 'exists:absence_categories,id'],
            'date_from' => ['required', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'reason' => ['required', 'string', 'min:10', 'max:2000'],
            'attachments' => ['sometimes', 'array', 'max:3'],
            'attachments.*' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:4096'],
            'remove_attachments' => ['sometimes', 'array'],
            'remove_attachments.*' => ['integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'date_to.after_or_equal' => 'The end date must be on or after the start date.',
            'reason.min' => 'Please explain the reason in at least 10 characters.',
            'attachments.*.mimes' => 'Supporting documents must be a PDF, JPG or PNG file.',
            'attachments.*.max' => 'Each file must not be larger than 4 MB.',
        ];
    }
}
