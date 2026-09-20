"use client";

import { useRef, useState, type FormEvent } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useAuth } from "./AuthProvider";
import styles from "./AuthModal.module.css";

export function AuthModal() {
  const {
    modalOpen, mode, error, notice, pendingEmail,
    closeModal, setMode, setPendingEmail, signIn, signUp, resendVerification,
  } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusTrap(modalRef, modalOpen, closeModal);

  if (!modalOpen) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    setSubmitting(true);
    try {
      if (mode === "login") await signIn(email, password);
      else await signUp(String(formData.get("full_name") ?? ""), email, password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeModal();
    }}>
      <div className={styles.modal} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className={styles.close} type="button" onClick={closeModal} aria-label="Tutup dialog akun">
          <span aria-hidden="true">×</span>
        </button>
        <p className="eyebrow"><span /> Akun pasien</p>
        <h2 id="auth-title">{mode === "login" ? "Selamat datang kembali." : "Mulai dari sini."}</h2>
        <form onSubmit={handleSubmit} noValidate={false}>
          {mode === "register" && (
            <label htmlFor="auth-full-name">
              Nama lengkap
              <input id="auth-full-name" name="full_name" required placeholder="Nama kamu" autoComplete="name" />
            </label>
          )}
          <label htmlFor="auth-email">
            Email
            <input
              id="auth-email"
              name="email"
              type="email"
              required
              placeholder="nama@email.com"
              autoComplete="email"
              defaultValue={pendingEmail}
              onChange={(event) => setPendingEmail(event.target.value)}
            />
          </label>
          <label htmlFor="auth-password">
            Password
            <input
              id="auth-password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              aria-describedby="auth-password-hint"
            />
          </label>
          <p className="form-hint" id="auth-password-hint">Gunakan minimal 6 karakter.</p>
          <div role="alert" aria-live="assertive">
            {error && <p className="form-error">{error}</p>}
          </div>
          <div role="status" aria-live="polite">
            {notice && <p className="form-note">{notice}</p>}
          </div>
          <button className="primary-button form-submit" type="submit" disabled={submitting}>
            {mode === "login" ? "Masuk" : "Buat akun"} <span aria-hidden="true">↗</span>
          </button>
          {pendingEmail && (
            <button
              className="text-button form-submit"
              type="button"
              onClick={() => void resendVerification()}
            >
              Kirim ulang email verifikasi
            </button>
          )}
        </form>
        <button
          className={`text-button ${styles.switch}`}
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </div>
    </div>
  );
}
