<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_number' => ['required', 'string', 'regex:/^[0-9]{5}$/', 'unique:users,id_number'],
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_number.unique' => 'This ID number is already registered.',
            'id_number.regex' => 'Student IDs must contain exactly 5 digits.',
        ];
    }
}
