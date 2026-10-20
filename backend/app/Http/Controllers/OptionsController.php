<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Http\Resources\SubjectResource;
use App\Models\AbsenceCategory;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;

class OptionsController extends Controller
{
    /** Unpaginated lists used to fill dropdowns and filters in React forms. */
    public function index(): JsonResponse
    {
        return response()->json(['data' => [
            'subjects' => SubjectResource::collection(Subject::with('teacher')->orderBy('code')->get()),
            'categories' => CategoryResource::collection(AbsenceCategory::orderBy('name')->get()),
        ]]);
    }
}
