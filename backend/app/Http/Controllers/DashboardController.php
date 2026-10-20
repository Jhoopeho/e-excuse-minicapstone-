<?php

namespace App\Http\Controllers;

use App\Models\AbsenceCategory;
use App\Models\ExcuseRequest;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /** Summary figures computed from the database, scoped to the current user's role. */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $base = fn () => ExcuseRequest::query()->visibleTo($user);
        $monthStart = now()->startOfMonth();

        $topCategory = $base()
            ->selectRaw('category_id, count(*) as total')
            ->groupBy('category_id')->orderByDesc('total')->first();

        $topSubject = $base()
            ->selectRaw('subject_id, count(*) as total')
            ->groupBy('subject_id')->orderByDesc('total')->first();

        $byStatus = $base()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        // Last 6 months for the dashboard chart (grouped in PHP so it works on MySQL and SQLite).
        $months = collect(range(5, 0))->mapWithKeys(fn ($i) => [now()->subMonths($i)->format('Y-m') => 0]);
        $base()->where('created_at', '>=', now()->subMonths(5)->startOfMonth())->pluck('created_at')
            ->each(function ($d) use (&$months) {
                $key = $d->format('Y-m');
                if ($months->has($key)) {
                    $months[$key] = $months[$key] + 1;
                }
            });

        return response()->json(['data' => [
            'total_requests' => $base()->count(),
            'pending_requests' => $base()->where('status', ExcuseRequest::PENDING)->count(),
            'approved_this_month' => $base()->where('status', ExcuseRequest::APPROVED)->where('reviewed_at', '>=', $monthStart)->count(),
            'rejected_this_month' => $base()->where('status', ExcuseRequest::REJECTED)->where('reviewed_at', '>=', $monthStart)->count(),
            'top_category' => $topCategory ? [
                'name' => AbsenceCategory::find($topCategory->category_id)?->name,
                'total' => (int) $topCategory->total,
            ] : null,
            'top_subject' => $topSubject ? [
                'name' => ($s = Subject::find($topSubject->subject_id))?->code.' — '.$s?->name,
                'total' => (int) $topSubject->total,
            ] : null,
            'by_status' => [
                'pending' => (int) ($byStatus['pending'] ?? 0),
                'approved' => (int) ($byStatus['approved'] ?? 0),
                'rejected' => (int) ($byStatus['rejected'] ?? 0),
            ],
            'by_month' => $months->map(fn ($total, $month) => ['month' => $month, 'total' => $total])->values(),
        ]]);
    }
}
