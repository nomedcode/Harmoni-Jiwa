<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Forces every API request to be treated as expecting a JSON response,
 * regardless of the client's Accept header. Without this, Laravel's
 * default validation/auth exception handling redirects (302) instead of
 * returning 422/401 JSON when a client omits "Accept: application/json".
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
