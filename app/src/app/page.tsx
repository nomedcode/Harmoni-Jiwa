"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const services = [
  { number: "01", title: "Konsultasi awal", text: "Ruang tenang untuk memahami apa yang sedang kamu alami dan menentukan langkah pertama." },
  { number: "02", title: "Kecemasan & mood", text: "Pendampingan terarah untuk kecemasan, depresi, burnout, dan perubahan suasana hati." },
  { number: "03", title: "Konsultasi remaja", text: "Pendekatan yang hangat untuk remaja dan keluarga yang ingin saling memahami." },
];

const schedules = ["09:00", "10:30", "13:00", "14:30", "16:00"];

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  async function syncProfile(nextSession: Session) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1"}/auth/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${nextSession.access_token}` },
      body: JSON.stringify({ full_name: nextSession.user.user_metadata.full_name ?? nextSession.user.email ?? "Pasien" }),
    });
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) void syncProfile(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) void syncProfile(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.access_token) {
      setAuthOpen(true);
      setAuthError("Masuk terlebih dahulu untuk membuat janji.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1"}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        full_name: formData.get("name"), gender: formData.get("gender"), phone_number: formData.get("phone"),
        service_type: formData.get("service"), schedule: `${formData.get("date")} ${formData.get("time")}`, employee_id: 1,
      }),
    });

    if (response.ok) setSubmitted(true);
    else setAuthError((await response.json()).message ?? "Jadwal belum berhasil dibuat.");
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");
    if (!supabase) { setAuthError("Supabase belum dikonfigurasi."); return; }
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const result = authMode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: formData.get("full_name") } } });
    if (result.error) { setAuthError(result.error.message); return; }
    if (authMode === "register") setAuthMessage("Cek email kamu untuk konfirmasi akun.");
    else setAuthOpen(false);
  }

  return (
    <div className="site-shell">
      <header className="site-header"><a className="brand" href="#top" aria-label="Doktor Personal home"><span className="brand-mark">DP</span><span>doktor<br /><em>personal</em></span></a><nav className="nav-links" aria-label="Navigasi utama"><a href="#tentang">Tentang kami</a><a href="#layanan">Layanan</a><a href="#booking">Booking</a></nav>{session ? <button className="header-cta" onClick={() => supabase?.auth.signOut()}>Keluar</button> : <button className="header-cta" onClick={() => setAuthOpen(true)}>Masuk <span aria-hidden="true">↗</span></button>}</header>
      <main id="top">
        <section className="hero-section page-grid"><div className="hero-copy"><p className="eyebrow"><span /> Klinik psikiatri personal</p><h1>Tempat pulang<br /><i>untuk pikiranmu.</i></h1><p className="hero-intro">Percakapan yang aman, profesional, dan manusiawi untuk membantu kamu menjalani hari dengan lebih ringan.</p><a className="primary-button" href="#booking">Mulai konsultasi <span aria-hidden="true">↗</span></a><div className="trust-row"><span className="trust-avatars">● ● ●</span><span>Dipercaya oleh 500+ pasien</span></div></div><div className="hero-art" aria-label="Ilustrasi ruang konsultasi yang tenang"><div className="sun-shape" /><div className="arch-shape" /><div className="plant-shape" /><div className="chair-shape" /><span className="art-caption">ruang aman<br /><strong>untuk bercerita.</strong></span></div></section>
        <section className="quote-band" id="tentang"><p>“Tidak harus selalu kuat.<br /><i>Kamu hanya perlu mulai bercerita.</i>”</p><span>— Dokter Aditama, Psikiater</span></section>
        <section className="services-section page-grid" id="layanan"><div className="section-heading"><p className="eyebrow"><span /> Yang kami bantu</p><h2>Ruang untuk<br /><i>menjadi lebih baik.</i></h2></div><div className="service-list">{services.map((service) => <article className="service-item" key={service.number}><span>{service.number}</span><div><h3>{service.title}</h3><p>{service.text}</p></div><b aria-hidden="true">↗</b></article>)}</div></section>
        <section className="booking-section page-grid" id="booking"><div className="booking-intro"><p className="eyebrow"><span /> Langkah pertama</p><h2>Jadwalkan<br /><i>sesi kamu.</i></h2><p>Pilih waktu yang terasa paling nyaman. Kami akan menghubungi kamu melalui WhatsApp untuk mengonfirmasi jadwal.</p><div className="doctor-note"><div className="doctor-avatar">DA</div><div><strong>dr. Aditama, Sp.KJ</strong><small>Psikiater · Senin—Sabtu</small></div></div></div><div className="form-card">{submitted ? <div className="success-state"><span className="success-icon">✓</span><h3>Permintaan terkirim.</h3><p>Terima kasih sudah memilih untuk mulai bercerita. Tim kami akan menghubungi kamu melalui WhatsApp.</p><button className="text-button" onClick={() => setSubmitted(false)}>Buat janji lain ↗</button></div> : <form onSubmit={handleSubmit}><div className="form-header"><span>01 / 03</span><strong>{session ? "Data diri" : "Masuk untuk booking"}</strong></div><label>Nama lengkap<input name="name" placeholder="Nama kamu" required /></label><label>Nomor WhatsApp<input name="phone" type="tel" placeholder="08xx xxxx xxxx" required /></label><label>Jenis kelamin<select name="gender" defaultValue="" required><option value="" disabled>Pilih</option><option value="M">Laki-laki</option><option value="F">Perempuan</option></select></label><label>Jenis konsultasi<select name="service" defaultValue="" required><option value="" disabled>Pilih layanan</option><option>Konsultasi awal</option><option>Kecemasan & mood</option><option>Konsultasi remaja</option></select></label><div className="form-row"><label>Tanggal<input name="date" type="date" required /></label><label>Jam<select name="time" defaultValue="" required><option value="" disabled>Pilih</option>{schedules.map((time) => <option key={time}>{time}</option>)}</select></label></div><label className="consent"><input type="checkbox" required /><span>Saya setuju menerima konfirmasi jadwal melalui WhatsApp.</span></label>{authError && <p className="form-error">{authError}</p>}<button className="primary-button form-submit" type="submit">Kirim permintaan <span aria-hidden="true">↗</span></button></form>}</div></section>
      </main>
      {authOpen && <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title"><div className="auth-modal"><button className="auth-close" onClick={() => setAuthOpen(false)} aria-label="Tutup">×</button><p className="eyebrow"><span /> Akun pasien</p><h2 id="auth-title">{authMode === "login" ? "Selamat datang kembali." : "Mulai dari sini."}</h2><form onSubmit={handleAuth}>{authMode === "register" && <label>Nama lengkap<input name="full_name" required placeholder="Nama kamu" /></label>}<label>Email<input name="email" type="email" required placeholder="nama@email.com" /></label><label>Password<input name="password" type="password" required minLength={6} placeholder="Minimal 6 karakter" /></label>{authError && <p className="form-error">{authError}</p>}{authMessage && <p className="auth-message">{authMessage}</p>}<button className="primary-button form-submit" type="submit">{authMode === "login" ? "Masuk" : "Buat akun"} <span aria-hidden="true">↗</span></button></form><button className="text-button auth-switch" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>{authMode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}</button></div></div>}
      <footer className="site-footer"><div className="brand"><span className="brand-mark">DP</span><span>doktor<br /><em>personal</em></span></div><span>Jakarta · Indonesia</span><a href="mailto:hello@doktorpersonal.id">hello@doktorpersonal.id ↗</a><span>© 2026 Doktor Personal</span></footer>
    </div>
  );
}
