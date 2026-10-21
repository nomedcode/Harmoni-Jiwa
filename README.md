# Harmoni Jiwa

<img width="926" height="385" alt="image" src="https://github.com/user-attachments/assets/40b033d4-a41d-4dd2-b955-ae1b07ef35ed" />
<img width="926" height="494" alt="image" src="https://github.com/user-attachments/assets/8decb73b-42dc-46f1-97bc-330888e25c29" />

Appointment booking platform for psychiatric consultations. Monorepo containing a Next.js frontend and a Laravel REST API backend.

## Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Running the Application](#running-the-application)
  - [Option A — Local Development](#option-a--local-development)
  - [Option B — Docker Compose](#option-b--docker-compose)
- [Testing the Application](#testing-the-application)
  - [Automated Tests](#automated-tests)
  - [Manual Smoke Test with Demo Accounts](#manual-smoke-test-with-demo-accounts)
  - [API Testing with Postman](#api-testing-with-postman)
- [Stopping and Resetting](#stopping-and-resetting)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

## Overview

Patients book consultation slots through the web app; staff manage appointments through an internal dashboard. Authentication is handled by Supabase, while the Laravel API owns all appointment, patient, and staff data.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, CSS Modules |
| Backend | Laravel 12, PostgreSQL / SQLite (local) |
| Auth | Supabase Auth (JWT) |
| Testing | Vitest + React Testing Library (frontend), PHPUnit (backend) |
| Deployment | Vercel (frontend), Proxmox VM/LXC (backend) |

## Repository Structure

```text
app/        Next.js frontend — see app/README.md
backend/    Laravel REST API — see backend/README.md
supabase/   Local Supabase CLI project (Auth + Postgres for development)
postman/    Postman collection for manual API testing
scripts/    Helper scripts (demo account seeding for Supabase Auth)
```

## Architecture

```text
Browser
  -> Vercel (Next.js)
  -> HTTPS API domain
  -> Laravel API (Proxmox)
  -> PostgreSQL (Proxmox)
```

Supabase Auth issues the JWT. Laravel verifies that JWT before granting access to appointment data — the backend does not store login credentials itself.

### Networking note

Vercel and public browsers are not automatically part of a private network (e.g. Tailscale). Do not set `NEXT_PUBLIC_API_URL` to a private IP or private network hostname in production. Choose one:

1. The Laravel API has a public HTTPS domain, with a firewall exposing only the API port.
2. A public reverse proxy / API gateway forwards requests to the Laravel service over a private network.
3. Frontend and backend run on the same private network (internal-only deployment).

Every API request must still carry a Supabase JWT, and its authorization is validated by Laravel.

## Prerequisites

| Tool | Used for | Version |
|---|---|---|
| Node.js | Frontend (`npm`) | LTS |
| PHP + Composer | Backend (Laravel) | PHP 8.2+ |
| Docker | Supabase CLI containers, Docker Compose option | Docker Desktop or Engine |
| Supabase CLI | Local Auth stack | latest |
| Python | `scripts/supabase_demo_users.py` | Python 3 |
| Postman (optional) | Manual API testing | latest |

Windows/PowerShell note: use `Copy-Item` instead of `cp`, and set an environment variable with `$env:SUPABASE_SERVICE_KEY = "<sb_secret_...>"` instead of the `VAR=... command` syntax.

## Running the Application

Two supported ways to run the full stack locally: **Option A** runs each component directly (best for development), **Option B** runs everything in Docker containers (best for a clean, reproducible environment). Both require the local Supabase Auth stack, which stays outside Docker and runs through the Supabase CLI.

### Option A — Local Development

```bash
# 1. Start the local Supabase Auth stack, then copy the keys it prints
cd supabase
supabase start
supabase status    # copy the publishable (sb_publishable_...) and secret (sb_secret_...) keys
cd ..

# 2. Frontend — put the publishable key into .env.local, install, run
cp app/.env.local.example app/.env.local
cd app
npm install
npm run dev        # http://localhost:3000

# 3. Backend — SQLite by default, no database server required (separate terminal)
cd ../backend
cp .env.example .env
php artisan key:generate

# 4. Create the two demo accounts in Supabase Auth (secret key from step 1);
#    the script records their ids in backend/database/seeders/demo-user-ids.json
SUPABASE_SERVICE_KEY=<sb_secret_...> ../scripts/supabase_demo_users.py

# 5. Migrate, seed demo data, serve the API
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000   # http://127.0.0.1:8000
```

You need **two terminals**: one for `npm run dev` (frontend) and one for `php artisan serve` (backend), plus the Supabase stack running in the background.

Demo accounts (password `Password123!`): `pasien@harmoni.test` signs in as a patient, `karyawan@harmoni.test` opens the staff dashboard.

Windows/PowerShell: use `Copy-Item` instead of `cp`, and set the key with `$env:SUPABASE_SERVICE_KEY = "<sb_secret_...>"` before running the script.

Environment variables, role setup, and seeders are documented in `app/README.md` and `backend/README.md`.

### Option B — Docker Compose

Compose builds three images: `frontend` (Next.js), `backend` (Laravel + nginx), and `postgres` (database, stored in the named `db-data` volume). Supabase Auth stays outside Compose and keeps running through the Supabase CLI — the browser reaches it at `http://127.0.0.1:54321`, while the backend fetches its JWKS through `host.docker.internal`.

```bash
# 1. Start the local Supabase stack and copy the publishable key
cd supabase && supabase start && supabase status && cd ..

# 2. Feed the key to Compose (docker compose auto-loads .env)
cp .env.example .env    # paste the sb_publishable_... key into NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Create the two demo accounts (secret key from step 1); the script
#    records their Supabase ids for the seeder in
#    backend/database/seeders/demo-user-ids.json
SUPABASE_SERVICE_KEY=<sb_secret_...> scripts/supabase_demo_users.py

# 4. Build and start — frontend :3000, backend :8080, postgres internal
docker compose up --build -d

# 5. First run (or a fresh volume): migrate and seed the demo data
docker compose exec backend php artisan migrate --seed

# 6. Open http://localhost:3000 and sign in with the local development demo accounts
```

Windows/PowerShell equivalent:

```powershell
Copy-Item .env.example .env      # then paste the sb_publishable_... key into .env
$env:SUPABASE_SERVICE_KEY = "<sb_secret_...>"
python scripts\supabase_demo_users.py
docker compose up --build -d
docker compose exec backend php artisan migrate --seed
```

`docker compose ps` shows each service going `healthy`: the frontend answers `wget`, the backend answers Laravel's `/up` health endpoint, and postgres answers `pg_isready`. Demo data survives `docker compose down` and container recreation because postgres writes to the `db-data` volume — only `docker compose down -v` erases it. On a fresh machine the demo accounts get new Supabase IDs: step 3 records them in `backend/database/seeders/demo-user-ids.json` (machine-specific and gitignored), and Compose mounts the backend seeders directory read-only into the container so `ClinicDemoSeeder` binds the demo rows to those ids — no code edits needed. Until the file exists, the seeder falls back to the ids recorded on the original demo machine.

For deployment, Vercel hosts the frontend only (see `app/README.md`); the backend image also runs on any VM with Docker (`docker run -p 8080:8080`) — `backend/.env.docker.example` documents its environment.

### Service ports (local)

| Service | URL | Notes |
|---|---|---|
| Frontend | http://localhost:3000 | `npm run dev` |
| Laravel API (local dev) | http://127.0.0.1:8000 | `php artisan serve` |
| Laravel API (Docker) | http://localhost:8080 | Compose `backend` service |
| Supabase Auth (local) | http://127.0.0.1:54321 | Supabase CLI stack |

## Testing the Application

### Automated Tests

Frontend (run inside `app/`):

```bash
cd app
npm run lint        # ESLint
npm run build       # production build as a smoke check
npm test            # Vitest + React Testing Library (jsdom), single run
npm run test:watch  # Vitest in watch mode while developing
```

Backend (run inside `backend/`):

```bash
cd backend
php artisan route:list --path=api   # confirm all API routes are registered
php artisan migrate:status          # confirm all migrations ran
php vendor/bin/phpunit -c phpunit.xml tests
```

Run the full check from the repository root:

```bash
cd app && npm run lint && npm test && cd ../backend && php vendor/bin/phpunit -c phpunit.xml tests
```

### Manual Smoke Test with Demo Accounts

After the stack is running (either option), verify the core flows end to end at `http://localhost:3000`:

1. **Sign in as a patient** — log in with `pasien@harmoni.test` / `Password123!`, submit the booking form, and confirm the success card appears (the appointment is sent to `POST /api/v1/appointments` behind the UI). The patient-facing appointment list page is not built yet — verify the new row through the staff dashboard or `GET /api/v1/appointments` with the token.
2. **Sign in as staff** — log out, then sign in with `karyawan@harmoni.test` / `Password123!`, open the staff dashboard, and confirm the queued appointments are visible.
3. **Exercise staff actions** — as staff, change an appointment's status (PATCH) and delete one (DELETE), then confirm the list updates.

### API Testing with Postman

The collection lives in `postman/` (`postman/collections/Klinik Doktor Personal API`), with an example environment in `postman/environments/Klinik Personal - Local.example.yaml`. Point it at the running backend:

- Local dev backend: `http://127.0.0.1:8000/api/v1`
- Docker backend: `http://localhost:8080/api/v1`

Sign in via the frontend (or Supabase Auth) to obtain a JWT, put it in the collection's bearer-token variable, and exercise the endpoints listed in `backend/README.md` (`/auth/sync`, `/appointments`, `/employees`, `/queues`, `/staff/appointments`). Keep local bearer tokens in the git-ignored environment file only. Do not ship debug pages to production.

The API client has a 10-second timeout and surfaces the request URL, HTTP status, Laravel JSON message, or the underlying network/CORS error when a request fails.

## Stopping and Resetting

```bash
# Docker Compose stack — data survives
docker compose down

# Docker Compose stack + erase the database volume
docker compose down -v

# Local Supabase stack
cd supabase && supabase stop          # add --no-backup to skip a final backup

# Re-run backend migrations and demo seeders from scratch (SQLite)
cd backend && php artisan migrate:fresh --seed
```

## Troubleshooting

Problems observed on Windows/Docker Desktop setups:

- **`supabase` is not recognized** — the CLI is not on `PATH`. Either add its install location (e.g. `%USERPROFILE%\bin`) to `PATH`, or call the executable directly: `& "$env:USERPROFILE\bin\supabase.exe" status` from inside `supabase/`.
- **`docker compose up` fails with "dependency failed to start: container harmoni-postgres is unhealthy"** — the named `db-data` volume holds a Postgres data directory from an interrupted earlier run (logs show `database system was interrupted` / `database "klinik_personal" does not exist`). Reset it with `docker compose down -v`, then `docker compose up -d` again. **Warning:** `-v` erases the demo database; re-run `php artisan migrate --seed` afterwards.
- **`supabase_vector_*` keeps restarting** — a known Supabase CLI quirk on Windows; the rest of the stack (Auth, Kong, DB, Studio) stays healthy and the app is unaffected.
- **Frontend builds but login fails** — the publishable key in `.env` (Compose) or `app/.env.local` (local dev) does not match the running Supabase stack. Re-copy it from `supabase status`. `NEXT_PUBLIC_*` values are baked into the image/bundle, so rebuild (`docker compose up --build -d`) or restart `npm run dev` after changing them.
- **401 from the API with a fresh token** — the backend could not fetch the Supabase JWKS. Make sure the Supabase stack is running and, inside Compose, that `SUPABASE_JWKS_URL` still points at `host.docker.internal:54321`.

## Security

Never commit `.env`, `.env.local`, passwords, JWT secrets, Supabase service-role keys, or any private key. All environment templates are provided as `.env.*.example` files.
