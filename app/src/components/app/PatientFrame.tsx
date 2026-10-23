"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AppShell } from "./AppShell";
import styles from "./PatientFrame.module.css";

/** App shell for patient routes; the page renders only once a session exists. */
export function PatientFrame({ children }: { children: ReactNode }) {
  const { ready, session, isStaff, openModal, signOut } = useAuth();

  let content: ReactNode = children;
  if (!ready) {
    content = (
      <div className={styles.skeleton} aria-busy="true" aria-live="polite">
        <span className="visually-hidden">Memeriksa sesi login…</span>
        <span className={styles.bar} />
        <span className={`${styles.bar} ${styles.barShort}`} />
        <span className={styles.block} />
      </div>
    );
  } else if (!session) {
    content = (
      <section className={styles.gate} aria-labelledby="gate-title">
        <h1 id="gate-title">Masuk untuk melanjutkan</h1>
        <p>Jadwal dan janji konsultasi tersimpan di akun pasien kamu. Masuk atau buat akun dulu, lalu pilih waktunya.</p>
        <div className={styles.gateActions}>
          <button className="primary-button" type="button" onClick={() => openModal()}>Masuk</button>
          <Link className="secondary-button" href="/">Kembali ke beranda</Link>
        </div>
      </section>
    );
  }

  return (
    <AppShell
      variant={isStaff ? "staff" : "patient"}
      userLabel={session?.user.email}
      roleLabel={session ? (isStaff ? "Karyawan" : "Pasien") : undefined}
      onSignOut={session ? () => void signOut() : undefined}
      onSignIn={session ? undefined : () => openModal()}
    >
      {content}
    </AppShell>
  );
}
