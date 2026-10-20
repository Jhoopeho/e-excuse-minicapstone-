<?php

namespace App\Http\Controllers;

use App\Http\Requests\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\AbsenceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AbsenceCategoryController extends Controller
{
    // Read routes: any logged-in user. Write routes are wrapped in role:teacher (routes/api.php).
    public function index(Request $request)
    {
        $categories = AbsenceCategory::query()
            ->withCount('excuseRequests')
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->orderBy('name')
            ->paginate(min(max($request->integer('per_page', 10), 1), 50));

        return CategoryResource::collection($categories);
    }

    public function show(AbsenceCategory $category): CategoryResource
    {
        return new CategoryResource($category->loadCount('excuseRequests'));
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $category = AbsenceCategory::create($request->validated());

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function update(CategoryRequest $request, AbsenceCategory $category): CategoryResource
    {
        $category->update($request->validated());

        return new CategoryResource($category);
    }

    public function destroy(AbsenceCategory $category): Response|JsonResponse
    {
        if ($category->excuseRequests()->exists()) {
            return response()->json(['message' => 'This category is used by excuse requests and cannot be deleted.'], 409);
        }

        $category->delete();

        return response()->noContent();
    }
}
