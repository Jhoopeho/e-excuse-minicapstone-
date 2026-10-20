<?php

namespace Tests\Feature;

use App\Models\AbsenceCategory;
use App\Models\ExcuseRequest;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExcuseApiTest extends TestCase
{
    use RefreshDatabase;

    private function payload(Subject $subject, AbsenceCategory $category): array
    {
        return [
            'subject_id' => $subject->id,
            'category_id' => $category->id,
            'date_from' => '2026-10-01',
            'date_to' => '2026-10-02',
            'reason' => 'I had a high fever and could not attend class.',
        ];
    }

    public function test_register_login_and_current_user(): void
    {
        $this->postJson('/api/register', [
            'id_number' => '12345', 'name' => 'Test Student',
            'password' => 'secure-password', 'password_confirmation' => 'secure-password',
        ])->assertCreated()->assertJsonPath('user.role', 'student');

        $token = $this->postJson('/api/login', ['id_number' => '12345', 'password' => 'secure-password'])
            ->assertOk()->json('token');

        $this->withToken($token)->getJson('/api/user')->assertOk()->assertJsonPath('data.id_number', '12345');
    }

    public function test_registration_requires_exactly_five_digit_id_and_matching_password_confirmation(): void
    {
        $payload = [
            'id_number' => '1234',
            'name' => 'Test Student',
            'password' => 'different-password',
            'password_confirmation' => 'different-password',
        ];

        $this->postJson('/api/register', $payload)->assertUnprocessable()
            ->assertJsonValidationErrors(['id_number']);

        $payload['id_number'] = '25001';
        $this->postJson('/api/register', $payload)->assertCreated();

        $payload['id_number'] = '12346';
        $payload['password_confirmation'] = 'not-the-password';
        $this->postJson('/api/register', $payload)->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_guest_gets_401(): void
    {
        $this->getJson('/api/requests')->assertUnauthorized();
    }

    public function test_validation_returns_422(): void
    {
        $student = User::factory()->create();
        $this->actingAs($student, 'sanctum')->postJson('/api/requests', [])->assertStatus(422)
            ->assertJsonValidationErrors(['subject_id', 'category_id', 'date_from', 'reason']);
    }

    public function test_student_files_request_and_teacher_approves_it(): void
    {
        $teacher = User::factory()->teacher()->create();
        $student = User::factory()->create();
        $subject = Subject::factory()->create(['teacher_id' => $teacher->id]);
        $category = AbsenceCategory::factory()->create();

        $id = $this->actingAs($student, 'sanctum')
            ->postJson('/api/requests', $this->payload($subject, $category))
            ->assertCreated()->assertJsonPath('data.status', 'pending')->json('data.id');

        // Students cannot review their own request.
        $this->actingAs($student, 'sanctum')
            ->patchJson("/api/requests/$id/status", ['status' => 'approved', 'teacher_remarks' => 'ok ok'])
            ->assertForbidden();

        $this->actingAs($teacher, 'sanctum')
            ->patchJson("/api/requests/$id/status", ['status' => 'approved', 'teacher_remarks' => 'Verified, excused.'])
            ->assertOk()->assertJsonPath('data.status', 'approved');

        // Students may remove their own decided requests.
        $this->actingAs($student, 'sanctum')->deleteJson("/api/requests/$id")->assertNoContent();
    }

    public function test_absence_end_date_is_optional_when_creating_and_updating_requests(): void
    {
        $student = User::factory()->create();
        $teacher = User::factory()->teacher()->create();
        $subject = Subject::factory()->create(['teacher_id' => $teacher->id]);
        $category = AbsenceCategory::factory()->create();
        $payload = $this->payload($subject, $category);
        unset($payload['date_to']);

        $id = $this->actingAs($student, 'sanctum')->postJson('/api/requests', $payload)
            ->assertCreated()
            ->assertJsonPath('data.date_to', $payload['date_from'])
            ->json('data.id');

        $payload['date_to'] = null;
        $this->putJson("/api/requests/$id", $payload)
            ->assertOk()
            ->assertJsonPath('data.date_to', $payload['date_from']);
    }

    public function test_submitting_for_multiple_subjects_creates_independently_reviewable_requests(): void
    {
        $student = User::factory()->create();
        $firstTeacher = User::factory()->teacher()->create();
        $secondTeacher = User::factory()->teacher()->create();
        $firstSubject = Subject::factory()->create(['teacher_id' => $firstTeacher->id]);
        $secondSubject = Subject::factory()->create(['teacher_id' => $secondTeacher->id]);
        $category = AbsenceCategory::factory()->create();
        $payload = $this->payload($firstSubject, $category);
        unset($payload['subject_id']);
        $payload['subject_ids'] = [$firstSubject->id, $secondSubject->id];

        $this->actingAs($student, 'sanctum')->postJson('/api/requests', $payload)
            ->assertCreated()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.subject.id', $firstSubject->id)
            ->assertJsonPath('data.1.subject.id', $secondSubject->id);

        $this->actingAs($firstTeacher, 'sanctum')->getJson('/api/requests')
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.subject.id', $firstSubject->id);

        $this->actingAs($secondTeacher, 'sanctum')->getJson('/api/requests')
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.subject.id', $secondSubject->id);
    }

    public function test_student_cannot_see_other_students_requests(): void
    {
        $other = ExcuseRequest::factory()->create();
        $student = User::factory()->create();

        $this->actingAs($student, 'sanctum')->getJson("/api/requests/{$other->id}")->assertForbidden();
        $this->actingAs($student, 'sanctum')->getJson('/api/requests')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_student_cannot_manage_subjects(): void
    {
        $student = User::factory()->create();
        $this->actingAs($student, 'sanctum')
            ->postJson('/api/subjects', ['code' => 'XX-1', 'name' => 'Nope'])->assertForbidden();
    }

    public function test_list_is_paginated_and_filterable(): void
    {
        $student = User::factory()->create();
        ExcuseRequest::factory()->count(12)->create(['user_id' => $student->id]);
        ExcuseRequest::factory()->create(['user_id' => $student->id, 'status' => 'approved']);

        $this->actingAs($student, 'sanctum')->getJson('/api/requests?per_page=5')
            ->assertOk()->assertJsonCount(5, 'data')->assertJsonPath('meta.total', 13);

        $this->actingAs($student, 'sanctum')->getJson('/api/requests?status=approved')
            ->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_dashboard_has_summary_figures(): void
    {
        $student = User::factory()->create();
        ExcuseRequest::factory()->count(3)->create(['user_id' => $student->id]);

        $this->actingAs($student, 'sanctum')->getJson('/api/dashboard')
            ->assertOk()->assertJsonPath('data.total_requests', 3)->assertJsonPath('data.pending_requests', 3);
    }
}
