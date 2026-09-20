# Harmoni Jiwa — Backend

Laravel 12 REST API for the psychiatric consultation appointment platform, backed by PostgreSQL.

## Local Setup

1. Enable `extension=pdo_pgsql` and `extension=pgsql` in `php.ini`, then restart your terminal.
2. Create a PostgreSQL database named `klinik_personal`.
3. Copy `.env.postgres.example` to `.env`, then fill in `DB_PASSWORD` and `SUPABASE_JWT_SECRET`.
4. Run migrations:

```bash
php artisan migrate
```

5. Start the API:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

## Authentication

Supabase issues the JWT on sign-in. `VerifySupabaseJwt` middleware validates every request against `SUPABASE_JWT_SECRET` (HS256) — the backend never stores login credentials. Anyone holding `SUPABASE_JWT_SECRET` can forge a valid token for any role, so treat it as a production secret with the same care as a database password.

## API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/sync` | Sync a Supabase user into the local `users` table |
| POST | `/api/v1/appointments` | Create an appointment (patient) |
| GET | `/api/v1/appointments` | List the authenticated patient's appointments |
| GET | `/api/v1/employees` | List available psychiatrists/staff |
| GET | `/api/v1/queues` | List the active queue (`admin`/`karyawan` only) |
| GET | `/api/v1/staff/appointments` | List all appointments (`admin`/`karyawan` only) |

## Validation

```bash
php artisan route:list --path=api
php artisan migrate:status
php vendor/bin/phpunit -c phpunit.xml tests
```

## Environment Variables

| Variable | Purpose |
|---|---|
| `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL connection |
| `SUPABASE_JWT_SECRET` | HS256 secret used to verify Supabase-issued JWTs |
| `SUPABASE_URL`, `SUPABASE_JWKS_URL` | Supabase project endpoints |
| `FRONTEND_URLS` | Comma-separated list of allowed CORS origins |
| `APP_DEBUG` | Must be `false` in production |

Never commit `.env`. Use `.env.example` or `.env.postgres.example` as templates.
