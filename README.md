# Harmoni Jiwa
<img width="926" height="385" alt="image" src="https://github.com/user-attachments/assets/40b033d4-a41d-4dd2-b955-ae1b07ef35ed" />
<img width="926" height="494" alt="image" src="https://github.com/user-attachments/assets/8decb73b-42dc-46f1-97bc-330888e25c29" />


Appointment booking platform for psychiatric consultations. Monorepo containing a Next.js frontend and a Laravel REST API backend.

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

## Quickstart

Prerequisites: Node.js LTS, PHP 8.2+, Composer, Docker (the Supabase CLI runs the local Auth stack in containers), Python 3.

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

# 4. Create the two demo accounts in Supabase Auth (secret key from step 1)
SUPABASE_SERVICE_KEY=<sb_secret_...> ../scripts/supabase_demo_users.py

# 5. Migrate, seed demo data, serve the API
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000   # http://127.0.0.1:8000
```

Demo accounts (password `Password123!`): `pasien@harmoni.test` signs in as a patient, `karyawan@harmoni.test` opens the staff dashboard.

Windows/PowerShell: use `Copy-Item` instead of `cp`, and set the key with `$env:SUPABASE_SERVICE_KEY = "<sb_secret_...>"` before running the script.

Environment variables, role setup, and seeders are documented in `app/README.md` and `backend/README.md`.

## Security

Never commit `.env`, `.env.local`, passwords, JWT secrets, Supabase service-role keys, or any private key. All environment templates are provided as `.env.*.example` files.
