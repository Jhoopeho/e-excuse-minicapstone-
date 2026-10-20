<?php

namespace App\Policies;

use App\Models\Subject;
use App\Models\User;

class SubjectPolicy
{
    public function create(User $user): bool
    {
        return $user->isTeacher();
    }

    public function update(User $user, Subject $subject): bool
    {
        return $user->isTeacher() && $subject->teacher_id === $user->id;
    }

    public function delete(User $user, Subject $subject): bool
    {
        return $this->update($user, $subject);
    }
}
