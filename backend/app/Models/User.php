<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const TEACHER = 'teacher';
    public const STUDENT = 'student';

    protected $fillable = ['id_number', 'name', 'password', 'role'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['password' => 'hashed'];
    }

    public function isTeacher(): bool
    {
        return $this->role === self::TEACHER;
    }

    public function isStudent(): bool
    {
        return $this->role === self::STUDENT;
    }

    /** Subjects handled by this teacher. */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class, 'teacher_id');
    }

    /** Excuse requests filed by this student. */
    public function excuseRequests(): HasMany
    {
        return $this->hasMany(ExcuseRequest::class);
    }
}
