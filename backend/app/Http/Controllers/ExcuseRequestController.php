<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReviewExcuseRequest;
use App\Http\Requests\StoreExcuseRequestRequest;
use App\Http\Requests\UpdateExcuseRequestRequest;
use App\Http\Resources\ExcuseRequestResource;
use App\Models\AbsenceCategory;
use App\Models\ExcuseRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ExcuseRequestController extends Controller
{
    private const WITH = ['student', 'subject.teacher', 'category', 'attachments'];

    /** List with search, filters and pagination. Scoped to what the user may see. */
    public function index(Request $request)
    {
        $query = ExcuseRequest::query()
            ->visibleTo($request->user())
            ->with(self::WITH) // eager loading: no N+1 queries
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(function ($w) use ($term) {
                    $w->where('reason', 'like', $term)
                        ->orWhereHas('student', fn ($s) => $s->where('name', 'like', $term)->orWhere('id_number', 'like', $term))
                        ->orWhereHas('subject', fn ($s) => $s->where('code', 'like', $term)->orWhere('name', 'like', $term));
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->when($request->filled('subject_id'), fn ($q) => $q->where('subject_id', $request->integer('subject_id')))
            // Absence date range: show requests whose dates overlap the chosen range.
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('date_to', '>=', $request->input('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('date_from', '<=', $request->input('date_to')))
            ->latest('id');

        return ExcuseRequestResource::collection(
            $query->paginate(min(max($request->integer('per_page', 10), 1), 50))
        );
    }

    public function store(StoreExcuseRequestRequest $request): JsonResponse
    {
        Gate::authorize('create', ExcuseRequest::class);

        $excuses = DB::transaction(function () use ($request) {
            $data = $request->safe()->only(['category_id', 'date_from', 'date_to', 'reason']);
            $data['date_to'] ??= $data['date_from'];
            $subjectIds = $request->validated('subject_ids') ?? [$request->validated('subject_id')];
            $excuses = collect($subjectIds)->map(function ($subjectId) use ($data, $request) {
                $excuse = ExcuseRequest::create([
                    ...$data,
                    'subject_id' => $subjectId,
                    'user_id' => $request->user()->id,
                    'status' => ExcuseRequest::PENDING,
                ]);
                $this->storeFiles($excuse, $request->file('attachments', []));

                return $excuse;
            });

            return $excuses;
        });

        $excuses->each->load(self::WITH);
        if ($excuses->count() === 1) {
            return (new ExcuseRequestResource($excuses->first()))->response()->setStatusCode(201);
        }

        return ExcuseRequestResource::collection($excuses)->response()->setStatusCode(201);
    }

    public function show(ExcuseRequest $excuseRequest): ExcuseRequestResource
    {
        Gate::authorize('view', $excuseRequest);

        return new ExcuseRequestResource($excuseRequest->load(self::WITH));
    }

    /** Student edits own request, only while Pending. Multipart: send POST with _method=PUT. */
    public function update(UpdateExcuseRequestRequest $request, ExcuseRequest $excuseRequest): ExcuseRequestResource
    {
        Gate::authorize('update', $excuseRequest);

        DB::transaction(function () use ($request, $excuseRequest) {
            $data = $request->safe()->only(['subject_id', 'category_id', 'date_from', 'date_to', 'reason']);
            $data['date_to'] ??= $data['date_from'];
            $excuseRequest->update($data);

            $removeIds = $request->input('remove_attachments', []);
            $excuseRequest->attachments()->whereIn('id', $removeIds)->get()->each(function ($a) {
                Storage::disk('public')->delete($a->file_path);
                $a->delete();
            });

            $this->storeFiles($excuseRequest, $request->file('attachments', []));

            $needsFile = AbsenceCategory::whereKey($excuseRequest->category_id)->value('requires_attachment');
            $count = $excuseRequest->attachments()->count();
            if ($needsFile && $count === 0) {
                throw ValidationException::withMessages(['attachments' => ['This category requires a supporting document.']]);
            }
            if ($count > 3) {
                throw ValidationException::withMessages(['attachments' => ['You can attach at most 3 files.']]);
            }
        });

        return new ExcuseRequestResource($excuseRequest->fresh()->load(self::WITH));
    }

    public function destroy(ExcuseRequest $excuseRequest): Response
    {
        Gate::authorize('delete', $excuseRequest);

        $excuseRequest->load('attachments')->attachments->each(
            fn ($a) => Storage::disk('public')->delete($a->file_path)
        );
        $excuseRequest->delete();

        return response()->noContent();
    }

    /** Status workflow: Pending -> Approved | Rejected, by the subject's teacher, with remarks. */
    public function updateStatus(ReviewExcuseRequest $request, ExcuseRequest $excuseRequest): ExcuseRequestResource
    {
        Gate::authorize('review', $excuseRequest);

        $excuseRequest->update([
            'status' => $request->status,
            'teacher_remarks' => $request->teacher_remarks,
            'reviewed_at' => now(),
        ]);

        return new ExcuseRequestResource($excuseRequest->load(self::WITH));
    }

    private function storeFiles(ExcuseRequest $excuse, array $files): void
    {
        foreach ($files as $file) {
            $excuse->attachments()->create([
                'file_path' => $file->store('attachments', 'public'),
                'original_name' => $file->getClientOriginalName(),
            ]);
        }
    }
}
