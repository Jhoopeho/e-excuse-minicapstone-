<?php

namespace App\Http\Requests;

use App\Models\AbsenceCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExcuseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // ExcuseRequestPolicy::create is checked in the controller.
    }

    public function rules(): array
    {
        $needsFile = AbsenceCategory::whereKey($this->input('category_id'))->value('requires_attachment');

        return [
            'subject_id' => ['required_without:subject_ids', 'nullable', 'integer', 'exists:subjects,id'],
            'subject_ids' => ['required_without:subject_id', 'array', 'min:1'],
            'subject_ids.*' => ['required', 'integer', 'distinct', 'exists:subjects,id'],
            'category_id' => ['required', 'integer', 'exists:absence_categories,id'],
            'date_from' => ['required', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'reason' => ['required', 'string', 'min:10', 'max:2000'],
            'attachments' => [Rule::requiredIf((bool) $needsFile), 'array', 'max:3'],
            'attachments.*' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:4096'],
        ];
    }

    public function messages(): array
    {
        return [
            'date_to.after_or_equal' => 'The end date must be on or after the start date.',
            'subject_ids.required_without' => 'Please choose at least one subject.',
            'subject_ids.min' => 'Please choose at least one subject.',
            'reason.min' => 'Please explain the reason in at least 10 characters.',
            'attachments.required' => 'This category requires a supporting document.',
            'attachments.*.mimes' => 'Supporting documents must be a PDF, JPG or PNG file.',
            'attachments.*.max' => 'Each file must not be larger than 4 MB.',
        ];
    }
}
