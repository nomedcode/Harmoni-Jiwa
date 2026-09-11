Product Requirement Document (PRD)
Web Appointment Konsultasi Psikiater - Klinik Doktor Personal
1. Executive Summary & Goals
1.1 Overview
Sistem ini merupakan aplikasi web reservasi/janji temu (appointment) untuk klinik psikiater personal. Web ini dirancang untuk memudahkan pasien melihat profil dokter, jenis layanan, dan mendaftar janji temu secara daring.

1.2 Tech Stack & Infrastructure
Frontend: Next.js (App Router, TypeScript, Tailwind CSS) → Deployed ke Vercel.

Backend: Laravel (REST API) → Deployed ke Kubernetes di dalam Proxmox LXC Container.

Database: PostgreSQL → Hosted di Proxmox LXC Container.

Networking & Mesh: Tailscale VPN (menghubungkan edge/Vercel serverless function atau API Gateway ke internal network Proxmox/Kubernetes).

Authentication: Supabase Auth (JWT / OAuth / Email-Password) terintegrasi dengan Next.js & dipadankan dengan Laravel Middleware.

2. System Architecture & Data Flow
[User Browser]
      │
      ├───────────────────────┐
      ▼                       ▼
[Supabase Auth]     [Next.js Frontend (Vercel)]
 (Auth Tokens)                │
                              │ (API Requests via Tailscale Tunnel)
                              ▼
                    [Laravel Backend (K8s / LXC)]
                              │
                              ▼
                   [PostgreSQL DB (LXC)]
Authentication Flow: Pasien/User melakukan Login/Daftar via Supabase Auth di Next.js. Supabase menerbitkan JWT token.

API Request Flow: Frontend Next.js mengirimkan request API ke Laravel backend melalui koneksi teraman (Tailscale / Private Ingress).

Database Operation: Laravel memvalidasi token/input, lalu melakukan query ke database PostgreSQL di Proxmox LXC.

3. Database Schema Specification (PostgreSQL)
Berdasarkan ERD sistem, berikut adalah spesifikasi DDL & Relasi Database:

3.1 Entity Relationship Summary
User (1) ─── (0..*) Patient

Patient (1) ─── (1) Patient_queue

Employee (1) ─── (0..*) Patient_queue

3.2 Tables & Migrations
Table 1: users
Mengakomodasi data akun pengguna yang terdaftar melalui autentikasi Supabase.

SQL
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    gender CHAR(1) CHECK (gender IN ('M', 'F')),
    phone_number VARCHAR(13) NOT NULL,
    supabase_uid VARCHAR(255) UNIQUE, -- Sync dengan Supabase Auth ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Table 2: patients
Data pendaftaran janji temu pasien. Satu akun User bisa mengaitkan beberapa record Patient (misal: mendaftarkan keluarga).

SQL
CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    gender CHAR(1) CHECK (gender IN ('M', 'F')),
    phone_number VARCHAR(13) NOT NULL,
    schedule TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Table 3: employees
Data dokter psikiater / staff klinik penanggung jawab.

SQL
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'Psychiatrist',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Table 4: patient_queues
Mengatur daftar antrean aktif konsultasi yang terhubung ke pasien dan dokter.

SQL
CREATE TABLE patient_queues (
    queue_id SERIAL PRIMARY KEY,
    patient_id INTEGER UNIQUE NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
    full_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'in_consultation', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
4. Frontend Wireframe & UI Layout Specification (Next.js)
Halaman utama dirancang sebagai Single Page Application (SPA) / Landing Page dengan Section Navigation:

4.1 Header / Navigation Bar
Branding: Nama Klinik / Logo Doktor Personal.

Navigation Links: Home | About | Layanan | Form

Auth Buttons: Tombol Daftar & Login (Memicu Modal/Route Supabase Auth).

4.2 Hero Section
Konten: Kalimat penyemangat/afirmasi kesehatan mental (misal: "Kesehatan mental Anda adalah prioritas kami").

Visual: Background Image / Vector Ilustrasi Psikiatri yang ramah & menenangkan.

4.3 Portfolio / Credentials Section
Konten: Replikasi rekam jejak dokter psikiater, riwayat pendidikan, sertifikasi, jumlah pasien ditangani, dan spesialisasi terapi.

4.4 About Us Section
Konten: Profil ringkas klinik doktor personal, visi pelayanan, serta pendekatan terapi psikiatri yang digunakan.

4.5 Layanan Section
Konten: Card list variasi layanan konsultasi (misal: Konsultasi Gangguan Kecemasan, Depresi, Terapi Perilaku Kognitif, Konsultasi Remaja/Dewasa, dll).

4.6 Form Order / Registrasi Appointment
Form Inputs:

Nama Lengkap (Auto-fill jika sudah login)

Jenis Kelamin (M/F)

Nomor Telepon (WhatsApp)

Tanggal & Jam Konsultasi (schedule)

Pilihan Psikiater/Dokter (employee_id)

CTA Button: Kirim / Booking Jadwal

4.7 Footer
Informasi Kontak (CP): Nomor WhatsApp/Telepon Klinik.

Alamat: Teks Alamat Fisik Klinik Personal.

About: Ringkasan singkat footer & Hak Cipta.

5. API Contracts (Laravel REST Backend)
5.1 Auth Integration Endpoint
POST /api/v1/auth/sync

Fungsi: Menyinkronkan profil user Supabase ke tabel users PostgreSQL saat pertama kali register/login.

Headers: Authorization: Bearer <SUPABASE_JWT_TOKEN>

Payload: { "full_name": string, "gender": "M"|"F", "phone_number": string }

5.2 Appointments Endpoint
POST /api/v1/appointments

Fungsi: Membuat janji konsultasi baru (menambahkan baris ke patients dan otomatis entry ke patient_queues).

Payload:

JSON
{
  "full_name": "Budi Santoso",
  "gender": "M",
  "phone_number": "081234567890",
  "schedule": "2026-10-15 10:00:00",
  "employee_id": 1
}
Response Status: 201 Created

Response Body:

JSON
{
  "message": "Janji temu berhasil dibuat",
  "data": {
    "patient_id": 12,
    "queue_status": "waiting",
    "schedule": "2026-10-15 10:00:00"
  }
}
5.3 Queue Endpoint
GET /api/v1/queues

Fungsi: Mengambil daftar antrean aktif (untuk tampilan dashboard admin/staf klinik).

6. Infrastructure & Deployment Guide for Copilot
Next.js & Vercel Setup:

Gunakan process.env.NEXT_PUBLIC_SUPABASE_URL dan process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY untuk autentikasi client.

Hubungkan Vercel ke Tailscale via Tailscale Subnet Router atau Tailscale Auth Key untuk merutekan request backend API ke Proxmox internal IP.

Laravel & Kubernetes (Proxmox LXC):

Buat Dockerfile untuk Laravel (PHP-FPM + Nginx).

Siapkan file Kubernetes Deployment (deployment.yaml) & Service (service.yaml) yang diekspos ke Tailscale mesh network.

Database Migration:

Jalankan php artisan migrate di pod Laravel Kubernetes untuk membentuk tabel users, patients, employees, dan patient_queues.

7. Instructions for VS Code Copilot
Gunakan perintah-perintah berikut saat meminta Copilot membuatkan kode:

@workspace Buatkan komponen Next.js (App Router) untuk section Hero dan Form Order sesuai spesifikasi PRD.md

@workspace Buatkan Laravel Migration dan Model untuk entitas User, Patient, Employee, dan PatientQueue sesuai schema di PRD.md

@workspace Buatkan Controller Laravel untuk menangani POST /api/v1/appointments yang menyimpan data ke tabel patients dan patient_queues secara DB Transaction.

@workspace Buatkan middleware Laravel untuk memverifikasi JWT dari Supabase Auth.