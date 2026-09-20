<?php

return [

    'supabase' => [
        'url' => env('SUPABASE_URL'),
        'jwks_url' => env('SUPABASE_JWKS_URL'),
        'jwt_secret' => env('SUPABASE_JWT_SECRET'),
        'jwt_algorithm' => env('SUPABASE_JWT_ALGORITHM', 'HS256'),

        /*
         * HS256 is a shared-secret algorithm: whoever holds
         * SUPABASE_JWT_SECRET can forge a valid token for any role. Off by
         * default. Turn on only if the Supabase project still signs with the
         * legacy HS256 key instead of ES256/JWKS.
         */
        'jwt_legacy_hs256_enabled' => env('SUPABASE_JWT_LEGACY_HS256_ENABLED', false),

        /*
         * Expected "iss" claim. Defaults to "<SUPABASE_URL>/auth/v1", which is
         * what Supabase Auth issues. Set explicitly only if you need to override.
         */
        'jwt_issuer' => env('SUPABASE_JWT_ISSUER'),

        /*
         * Accepted "aud" claims, comma separated. Supabase issues "authenticated"
         * for signed-in users (including anonymous sign-ins).
         */
        'jwt_audiences' => env('SUPABASE_JWT_AUDIENCES', 'authenticated'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
