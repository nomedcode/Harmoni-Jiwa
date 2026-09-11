# Klinik Doktor Personal Frontend

Next.js frontend untuk booking appointment konsultasi psikiater.

## Local

```powershell
Copy-Item .env.local.example .env.local
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` adalah public browser key. Jangan gunakan `service_role` atau secret key di frontend.

## Vercel

Import repository GitHub, pilih folder `app` sebagai Root Directory, lalu isi environment variables pada Vercel Project Settings. Untuk production, `NEXT_PUBLIC_API_URL` harus berupa URL HTTPS API Laravel yang dapat dijangkau browser, bukan `127.0.0.1`, IP private Proxmox, atau hostname internal Tailscale.

Build command: `npm run build`
Output: Next.js default
