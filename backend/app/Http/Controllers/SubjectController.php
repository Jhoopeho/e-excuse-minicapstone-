<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubjectRequest;
use App\Http\Resources\SubjectResource;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class SubjectController extends Controller
{
    /** Teachers see their own subjects; students see all (read-only). Search + pagination. */
    public function index(Request $request)
    {
        $user = $request->user();

        $subjects = Subject::query()
            ->with('teacher')
            ->withCount('excuseRequests')
            ->when($user->isTeacher(), fn ($q) => $q->where('teacher_id', $user->id))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(fn ($w) => $w->where('code', 'like', $term)->orWhere('name', 'like', $term));
            })
            ->orderBy('code')
            ->paginate(min(max($request->integer('per_page', 10), 1), 50));

        return SubjectResource::collection($subjects);
    }

    public function show(Subject $subject): SubjectResource
    {
        return new SubjectResource($subject->load('teacher')->loadCount('excuseRequests'));
    }

    public function store(SubjectRequest $request): JsonResponse
    {
        Gate::authorize('create', Subject::class);

        $subject = Subject::create([...$request->validated(), 'teacher_id' => $request->user()->id]);

        return (new SubjectResource($subject->load('teacher')))->response()->setStatusCode(201);
    }

    public function update(SubjectRequest $request, Subject $subject): SubjectResource
    {
        Gate::authorize('update', $subject);

        $subject->update($request->validated());

        return new SubjectResource($subject->load('teacher'));
    }

    public function destroy(Subject $subject): Response|JsonResponse
    {
        Gate::authorize('delete', $subject);

        if ($subject->excuseRequests()->exists()) {
            return response()->json(['message' => 'This subject already has excuse requests and cannot be deleted.'], 409);
        }

        $subject->delete();

        return response()->noContent();
    }
}
