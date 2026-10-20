<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SubjectFactory extends Factory
{
    public function definition(): array
    {
        return [
            'teacher_id' => User::factory()->teacher(),
            'code' => strtoupper(fake()->unique()->bothify('??-###')),
            'name' => fake()->words(3, true),
        ];
    }
}
