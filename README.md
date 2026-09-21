# Harmoni Jiwa
<img width="926" height="385" alt="image" src="https://github.com/user-attachments/assets/40b033d4-a41d-4dd2-b955-ae1b07ef35ed" />

Appointment booking platform for psychiatric consultations. Monorepo containing a Next.js frontend and a Laravel REST API backend.

## Overview

Patients book consultation slots through the web app; staff manage appointments through an internal dashboard. Authentication is handled by Supabase, while the Laravel API owns all appointment, patient, and staff data.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, CSS Modules |
| Backend | Laravel 12, PostgreSQL |
| Auth | Supabase Auth (JWT) |
| Testing | Vitest + React Testing Library (frontend), PHPUnit (backend) |
| Deployment | Vercel (frontend), Proxmox VM/LXC (backend) |

## Repository Structure

```text
app/        Next.js frontend — see app/README.md
backend/    Laravel REST API — see backend/README.md
postman/    Postman collection for manual API testing
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

Prerequisites: Node.js LTS, PHP 8.2+, Composer, PostgreSQL.

```powershell
# Frontend
cd app
npm install
npm run dev        # http://localhost:3000

# Backend (separate terminal)
cd backend
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000   # http://127.0.0.1:8000
```

Environment variables, role setup, and seeders are documented in `app/README.md` and `backend/README.md`.

## Security

Never commit `.env`, `.env.local`, passwords, JWT secrets, Supabase service-role keys, or any private key. All environment templates are provided as `.env.*.example` files.
