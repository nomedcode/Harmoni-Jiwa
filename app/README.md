# Harmoni Jiwa — Frontend

Next.js frontend for booking psychiatric consultation appointments.

## Local Development

```powershell
Copy-Item .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Structure

```text
src/
  app/                 App Router routes, layout, metadata, robots.ts, sitemap.ts
  components/auth/     AuthProvider (Supabase session state) and AuthModal
  components/landing/  Landing page sections, one file per section
  content/             Static copy and clinic constants
  hooks/                useFocusTrap for dialogs
  lib/                 Laravel API client, Supabase client, JSON-LD helpers
```

The landing page is a Server Component. Only `SiteHeader`, `BookingForm`, and `AuthModal` run on the client. Styling uses global design tokens in `src/app/globals.css` plus per-component CSS Modules.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is a public browser key. Never use the `service_role` or any secret key in the frontend. `NEXT_PUBLIC_SITE_URL` is used for the canonical URL, OpenGraph tags, `robots.txt`, and `sitemap.xml` — set it to the production domain on Vercel.

Restart `npm run dev` after changing `.env.local`.

## Validation

```powershell
npm run lint
npm run build
npm test
```

`npm test` runs Vitest with React Testing Library in a jsdom environment. Use `npm run test:watch` while developing.

## Deploying to Vercel

Import the GitHub repository, set `app` as the Root Directory, then configure the environment variables above in Vercel Project Settings. In production, `NEXT_PUBLIC_API_URL` must be an HTTPS URL reachable from the browser — never `127.0.0.1`, a private Proxmox IP, or an internal Tailscale hostname.

Build command: `npm run build`
Output: Next.js default

## API Testing

Use the Postman collection in the repository root (`postman/`). Keep local bearer tokens in the git-ignored environment file only. Do not ship debug pages to production.

The API client has a 10-second timeout and surfaces the request URL, HTTP status, Laravel JSON message, or the underlying network/CORS error when a request fails.
