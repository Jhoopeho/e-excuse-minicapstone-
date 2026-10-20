<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'app' => 'e-Excuse API',
    'message' => 'The API is running. The React app talks to it under /api.',
]));
