# Harmoni Jiwa — Backend

Laravel 12 REST API for the psychiatric consultation appointment platform, backed by PostgreSQL (or SQLite for local development).

## Local Setup

Quick path (SQLite default — no database server needed):

1. Copy `.env.example` to `.env`, then run `php artisan key:generate`.
2. Migrate and seed:

```bash
php artisan migrate --seed
```

3. Start the API:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

### PostgreSQL option

1. Enable `extension=pdo_pgsql` and `extension=pgsql` in `php.ini`, then restart your terminal.
2. Create a PostgreSQL database named `klinik_personal`.
3. Copy `.env.postgres.example` to `.env`, then fill in `DB_PASSWORD`.
4. Run `php artisan migrate --seed`.

The root README walks through the full local stack, including Supabase Auth; `scripts/supabase_demo_users.py` creates the demo accounts and records their Supabase ids in `database/seeders/demo-user-ids.json`, which `ClinicDemoSeeder` reads (with a built-in fallback) when binding demo rows to those accounts.

## Authentication

Supabase issues the JWT on sign-in. `VerifySupabaseJwt` middleware validates every request: by default it fetches the project's published JWKS (`SUPABASE_URL` / `SUPABASE_JWKS_URL`) and verifies ES256 signatures, caching the keys for one hour — the backend never stores login credentials. Legacy HS256 projects can opt in with `SUPABASE_JWT_LEGACY_HS256_ENABLED=true` plus `SUPABASE_JWT_SECRET`; that shared secret can forge a valid token for any role, so treat it with the same care as a database password.

## API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/sync` | Sync a Supabase user into the local `users` table |
| POST | `/api/v1/appointments` | Create an appointment (patient) |
| GET | `/api/v1/appointments` | List the authenticated patient's appointments |
| GET | `/api/v1/employees` | List available psychiatrists/staff |
| GET | `/api/v1/queues` | List the active queue (`admin`/`karyawan` only) |
| GET | `/api/v1/staff/appointments` | List all appointments (`admin`/`karyawan` only) |
| PATCH | `/api/v1/staff/appointments/{appointment}` | Update appointment status (`admin`/`karyawan` only) |
| DELETE | `/api/v1/staff/appointments/{appointment}` | Delete an appointment (`admin`/`karyawan` only) |

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
| `SUPABASE_JWT_SECRET` | Legacy HS256 secret; only used when legacy HS256 is enabled |
| `SUPABASE_JWT_LEGACY_HS256_ENABLED` | Opt-in legacy HS256 verification (`false` = ES256/JWKS default) |
| `SUPABASE_URL`, `SUPABASE_JWKS_URL` | Supabase project endpoints |
| `FRONTEND_URLS` | Comma-separated list of allowed CORS origins |
| `APP_DEBUG` | Must be `false` in production |

Never commit `.env`. Use `.env.example` (SQLite), `.env.postgres.example` (PostgreSQL), or `.env.docker.example` (Docker Compose) as templates.
