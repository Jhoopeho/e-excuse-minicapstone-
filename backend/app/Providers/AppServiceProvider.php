<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Policies (App\Policies\XPolicy for App\Models\X) are auto-discovered by Laravel.
    }
}
