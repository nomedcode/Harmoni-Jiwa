<?php

return [

    /*
    |--------------------------------------------------------------------------
    | API Rate Limits
    |--------------------------------------------------------------------------
    |
    | Tunable without a code change so limits can be tightened in production.
    |
    | general             : requests per minute per IP across all /api routes.
    | appointment_writes  : appointment creations per hour per authenticated
    |                       user. Booking floods would otherwise occupy every
    |                       available consultation slot.
    |
    */

    'rate_limits' => [
        'general' => env('API_RATE_LIMIT_PER_MINUTE', 60),
        'appointment_writes' => env('API_RATE_LIMIT_APPOINTMENTS_PER_HOUR', 10),
    ],

];
