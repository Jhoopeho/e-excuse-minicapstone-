<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/** @extends Factory<User> */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'id_number' => fake()->unique()->numerify('2026-#####'),
            'name' => fake()->name(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => User::STUDENT,
        ];
    }

    public function teacher(): static
    {
        return $this->state(fn () => ['role' => User::TEACHER, 'id_number' => fake()->unique()->numerify('T-####')]);
    }
}
