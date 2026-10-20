<?php

namespace Database\Factories;

use App\Models\AbsenceCategory;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExcuseRequestFactory extends Factory
{
    public function definition(): array
    {
        $from = fake()->dateTimeBetween('-60 days', 'now');

        return [
            'user_id' => User::factory(),
            'subject_id' => Subject::factory(),
            'category_id' => AbsenceCategory::factory(),
            'date_from' => $from->format('Y-m-d'),
            'date_to' => (clone $from)->modify('+'.fake()->numberBetween(0, 2).' days')->format('Y-m-d'),
            'reason' => fake()->sentence(12),
            'status' => 'pending',
        ];
    }
}
