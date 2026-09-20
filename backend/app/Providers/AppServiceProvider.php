<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * Laravel does not register any API rate limiter by default, which would
     * leave the public booking endpoints open to abuse.
     *
     * Per-user booking limits live in ThrottleAppointmentCreation instead,
     * because named throttles are hoisted ahead of JWT verification by the
     * framework's middleware priority list and could only key on IP.
     */
    private function configureRateLimiting(): void
    {
        // Cheap first gate against floods, keyed by IP.
        RateLimiter::for('api', function (Request $request): Limit {
            return Limit::perMinute((int) config('api.rate_limits.general'))
                ->by($request->ip());
        });
    }
}
