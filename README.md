# Klinik Doktor Personal

Monorepo aplikasi appointment konsultasi psikiater.

## Struktur

- `app/` - Next.js frontend, dideploy ke Vercel.
- `backend/` - Laravel REST API, dideploy ke VM/LXC atau Kubernetes di Proxmox.
- `PRD.md` - product requirement dan keputusan awal.

## Arsitektur deployment

```text
Browser
  -> Vercel / Next.js
  -> HTTPS API domain
  -> Laravel API di Proxmox
  -> PostgreSQL di Proxmox

Supabase Auth menerbitkan JWT. Laravel memverifikasi JWT sebelum mengakses data appointment.
```

### Catatan networking

Vercel dan browser publik tidak otomatis berada di Tailscale network. Jangan mengisi `NEXT_PUBLIC_API_URL` dengan IP private Proxmox atau hostname Tailscale untuk production.

Gunakan salah satu pola berikut:

1. API Laravel memiliki domain HTTPS publik dan firewall hanya membuka port API.
2. Gunakan reverse proxy/API gateway publik yang meneruskan request ke service Laravel melalui Tailscale.
3. Jalankan frontend dan backend pada jaringan private yang sama jika aplikasi hanya untuk internal.

Semua request API tetap harus menggunakan Supabase JWT dan validasi authorization di Laravel.

## Local development

### Frontend

```powershell
cd app
Copy-Item .env.local.example .env.local
npm install
npm run dev
```

Frontend berjalan di `http://localhost:3000`.

### Backend

```powershell
cd backend
Copy-Item .env.postgres.example .env
# isi DB_PASSWORD dan SUPABASE_JWT_SECRET
php artisan config:clear
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Backend berjalan di `http://127.0.0.1:8000`.

## Environment production

Frontend Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-publishable-or-anon-key>
NEXT_PUBLIC_API_URL=https://api.<domain-kamu>/api/v1
```

Backend Proxmox:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.<domain-kamu>
DB_CONNECTION=pgsql
DB_HOST=<postgres-private-host>
DB_PORT=5432
DB_DATABASE=klinik_personal
DB_USERNAME=<database-user>
DB_PASSWORD=<database-password>
SUPABASE_JWT_SECRET=<jwt-secret>
FRONTEND_URL=https://<frontend-domain>
```

Jangan commit `.env`, `.env.local`, password, JWT secret, Supabase service-role key, atau private key.

## Deployment checklist Proxmox

1. Buat LXC/VM terpisah untuk PostgreSQL.
2. Buat LXC/VM untuk Laravel API atau cluster Kubernetes jika memang diperlukan.
3. Batasi PostgreSQL agar hanya menerima koneksi dari backend.
4. Pasang HTTPS reverse proxy di depan Laravel.
5. Hubungkan reverse proxy dan backend melalui Tailscale jika API tidak ingin membuka service internal.
6. Jalankan migration dari backend setelah backup database tersedia.
7. Isi data psychiatrist/staff melalui seeder admin atau endpoint internal yang terproteksi.
8. Atur backup PostgreSQL dan uji restore sebelum production.
9. Atur log, health check, rate limit, dan alerting.
10. Set `APP_DEBUG=false` di production.

## Validation commands

```powershell
cd app
npm run lint
npm run build

cd ..\backend
php artisan route:list --path=api
php artisan migrate:status
php vendor\bin\phpunit -c phpunit.xml tests
```
