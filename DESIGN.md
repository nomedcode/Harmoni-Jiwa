# DESIGN.md — Kontrak Desain Frontend Harmoni Jiwa

> Rekonstruksi dari `app/src/app/globals.css` dan super prompt redesign.
> Sifat: **mengikat**. Jika bertentangan dengan selera, dokumen ini menang.
> Scope perubahan: `app/` dan file ini saja. Backend, Supabase, kontrak API tidak boleh berubah.

---

## Aturan Mutlak

1. Tidak ada hex baru di luar front matter token di bawah. Tidak ada ungu, indigo, gradient, teks gradient, blob dekoratif.
2. Tanpa dependensi baru (package.json dan lockfile tidak berubah), termasuk library ikon, kalender, atau test browser.
3. Tipografi: Plus Jakarta Sans (aplikasi), Newsreader (landing, khusus display). Tidak menambah font.
4. Ukuran teks minimum 12px. `dim` hanya untuk ikon dan teks ≥18px (atau tebal ≥14px) — gagal AA untuk teks kecil. Teks kecil memakai `muted`.
5. Border input memakai `muted` (bukan `input-line`); fokus ring `coral-text`.
6. Hierarki radius: 28 / 20 / 16 / 10 / pil (999).
7. Teks sentence case, kata kerja aktif. Satu aksi satu nama sepanjang alur: "Pilih" → "Lanjut isi data" → "Kirim permintaan" → "Permintaan terkirim."
8. Status nonaktif dibedakan dengan isyarat non-warna (coretan/ikon) + `aria-disabled` + `title` alasan.
9. Semua yang bergantung "sekarang" dihitung setelah mount; satu sumber waktu Asia/Jakarta untuk badge, kalender, slot.
10. `prefers-reduced-motion` wajib dihormati; gerak otomatis maksimal satu momen per halaman.
11. Tanpa harga, rating, tombol chat, notifikasi, mode gelap, field catatan pasien baru, tombol batal pasien.
12. Gate tiap fase: `npm run lint && npm test && npm run build` hijau + visual 6 lebar (360, 390, 768, 960, 1280, 1440).

## Front matter token (24)

12 warna dasar + 12 turunan, persis dari `globals.css`:

| Token | Hex | Peran |
|---|---|---|
| `ink` | `#193b3a` | Teks utama |
| `ink-2` | `#14302f` | Sidebar gelap, latar paling gelap |
| `muted` | `#4f655c` | Teks sekunder (AA di atas paper) |
| `paper` | `#fcfaf5` | Latar halaman |
| `coral` | `#e8755f` | Coral dekoratif (bentuk, fill tanpa teks) |
| `coral-text` | `#b44831` | Coral untuk teks & fill berteks |
| `coral-dark` | `#9c3a26` | Hover/pressed aksi coral |
| `sage` | `#d9e5dc` | Panel lembut |
| `sage-pale` | `#e6eee6` | Panel paling lembut |
| `border` | `#dce3dc` | Garis pemisah |
| `on-dark` | `#b6cbc2` | Teks di atas ink/ink-2 |
| `danger` | `#a8402f` | Error, status destruktif |
| `dim` | `#6f8279` | Ikon & teks besar saja (C2) |
| `nav-ink` | `#4c6660` | Navigasi |
| `sun` | `#e9a179` | Aksen hangat sekunder |
| `coral-pale` | `#f9e4d9` | Latar coral lembut |
| `coral-deep` | `#8f4331` | Coral tergelap |
| `blue-pale` | `#dfe7f2` | Latar biru lembut |
| `blue-ink` | `#3d5474` | Teks di atas blue-pale |
| `sage-mist` | `#e5eee5` | Variasi sage |
| `sage-ink` | `#3f5a4c` | Teks di atas sage |
| `clay-pale` | `#ece5e1` | Latar clay lembut |
| `clay-ink` | `#6b5249` | Teks di atas clay |

Radius: `28 / 20 / 16 / 10 / 999`. Lebar maksimum konten: 1180px.

## Kontrak API (tidak boleh diubah)

- `GET /employees` → `{ id, full_name, role }` — **tanpa foto, spesialisasi, harga**.
- `POST /appointments` payload: `{ full_name, gender, phone_number, service_type, schedule, employee_id }`, `schedule` = `YYYY-MM-DD HH:mm` waktu klinik (Asia/Jakarta), durasi 60 menit.
- `GET /appointments?page=N`, `GET /queues`, `GET /staff/appointments?page=N`.
- `PATCH /staff/appointments/{id}` (status), `DELETE /staff/appointments/{id}`.
- `POST /auth/sync`. Auth via `Authorization: Bearer <token>` (Supabase).

## Guardrail Layout

- Halaman publik (landing): tanpa sidebar, header sendiri.
- Halaman dalam `/booking`, `/janji-saya`, dashboard staf: `AppShell` (sidebar ikon gelap `ink-2`, aksi aktif coral) + topbar.
- Breakpoint wajib lolos: 360, 390, 768, 960, 1280, 1440. Di bawah 960, layout multi-kolom menjadi step bertahap.
- Fokus keyboard selalu terlihat; urutan tab di `/booking`: dokter → tanggal → jam → data → kirim.

## Checklist Verifikasi

1. Lint, test, build hijau.
2. Matriks 6 lebar × 4 halaman (landing, /booking, /janji-saya, dashboard).
3. Data ekstrem: 1/2/8 dokter; 0/1/20 janji; nama & email sangat panjang.
4. Keyboard penuh di /booking; zoom 200%.
5. Payload `createAppointment` identik dengan sebelumnya.
