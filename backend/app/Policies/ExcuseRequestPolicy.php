<?php

namespace App\Policies;

use App\Models\ExcuseRequest;
use App\Models\User;

class ExcuseRequestPolicy
{
    private function teachesSubject(User $user, ExcuseRequest $r): bool
    {
        return $user->isTeacher() && $r->subject->teacher_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isStudent();
    }

    public function view(User $user, ExcuseRequest $r): bool
    {
        return $r->user_id === $user->id || $this->teachesSubject($user, $r);
    }

    /** Only the owner, and only while the request is still Pending. */
    public function update(User $user, ExcuseRequest $r): bool
    {
        return $user->isStudent() && $r->user_id === $user->id && $r->status === ExcuseRequest::PENDING;
    }

    /** Students may remove their own requests; teachers may delete records for their subjects. */
    public function delete(User $user, ExcuseRequest $r): bool
    {
        return ($user->isStudent() && $r->user_id === $user->id) || $this->teachesSubject($user, $r);
    }

    /** Approve / reject: the subject's teacher, only while Pending. */
    public function review(User $user, ExcuseRequest $r): bool
    {
        return $this->teachesSubject($user, $r) && $r->status === ExcuseRequest::PENDING;
    }
}
