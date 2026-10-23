"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { site } from "@/content/site";
import styles from "./LandingShell.module.css";

const links = [
  { href: "#tentang", label: "Tentang" },
  { href: "#layanan", label: "Layanan" },
  { href: "#dokter", label: "Psikiater" },
  { href: "#ulasan", label: "Testimoni" },
  { href: "#faq", label: "FAQ" },
];

/**
 * Public shell for the landing page: a horizontal top navbar instead of the
 * app sidebar. Visitors get anchor navigation and a sign-in action; signed-in
 * users see their email plus a shortcut into the app.
 */
export function LandingShell({ children }: { children: ReactNode }) {
  const { session, isStaff, openModal, signOut } = useAuth();

  return (
    <div className={styles.page}>
      <a className="skip-link" href="#top">Lewati ke konten utama</a>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link className={styles.brand} href="/" aria-label={`${site.name}, halaman utama`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mark, nothing to optimise */}
            <img src="/logo.svg" alt="" width={32} height={32} />
            <span>{site.name}</span>
          </Link>
          <nav className={styles.nav} aria-label="Navigasi utama">
            {links.map(({ href, label }) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>
          <div className={styles.actions}>
            {session ? (
              <>
                <span className={styles.user}>{session.user.email}</span>
                <Link className={styles.appLink} href={isStaff ? "/karyawan/dashboard" : "/booking"}>
                  {isStaff ? "Dashboard" : "Buat janji"}
                </Link>
                <button className={styles.signOut} type="button" onClick={() => void signOut()}>
                  Keluar
                </button>
              </>
            ) : (
              <button className="header-cta" type="button" onClick={() => openModal()}>
                Masuk
              </button>
            )}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
