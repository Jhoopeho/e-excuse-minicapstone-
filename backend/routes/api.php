<?php

use App\Http\Controllers\AbsenceCategoryController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExcuseRequestController;
use App\Http\Controllers\OptionsController;
use App\Http\Controllers\SubjectController;
use Illuminate\Support\Facades\Route;

// Public
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

// Authenticated (Sanctum bearer token)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/options', [OptionsController::class, 'index']);

    // Read-only for everyone logged in
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::get('/subjects/{subject}', [SubjectController::class, 'show']);
    Route::get('/categories', [AbsenceCategoryController::class, 'index']);
    Route::get('/categories/{category}', [AbsenceCategoryController::class, 'show']);

    // Teacher-only (also hidden in React)
    Route::middleware('role:teacher')->group(function () {
        Route::post('/subjects', [SubjectController::class, 'store']);
        Route::put('/subjects/{subject}', [SubjectController::class, 'update']);
        Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy']);

        Route::post('/categories', [AbsenceCategoryController::class, 'store']);
        Route::put('/categories/{category}', [AbsenceCategoryController::class, 'update']);
        Route::delete('/categories/{category}', [AbsenceCategoryController::class, 'destroy']);

        Route::patch('/requests/{excuseRequest}/status', [ExcuseRequestController::class, 'updateStatus']);
    });

    // Excuse requests: students manage their own, teachers review. Ownership rules live in ExcuseRequestPolicy.
    Route::apiResource('requests', ExcuseRequestController::class)
        ->parameters(['requests' => 'excuseRequest']);
});
