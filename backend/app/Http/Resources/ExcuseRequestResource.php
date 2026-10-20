<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExcuseRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'date_from' => $this->date_from?->toDateString(),
            'date_to' => $this->date_to?->toDateString(),
            'reason' => $this->reason,
            'status' => $this->status,
            'teacher_remarks' => $this->teacher_remarks,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'student' => new UserResource($this->whenLoaded('student')),
            'subject' => new SubjectResource($this->whenLoaded('subject')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'attachments' => AttachmentResource::collection($this->whenLoaded('attachments')),
            // Lets the React UI show/hide buttons; Laravel still enforces every rule.
            'can' => [
                'update' => $request->user()?->can('update', $this->resource) ?? false,
                'delete' => $request->user()?->can('delete', $this->resource) ?? false,
                'review' => $request->user()?->can('review', $this->resource) ?? false,
            ],
        ];
    }
}
