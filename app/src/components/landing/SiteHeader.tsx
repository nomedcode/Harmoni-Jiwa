"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { navLinks, site } from "@/content/site";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  const { session, isStaff, openModal, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.inner}`}>
    <a className="brand" href="#top" aria-label="Harmoni Jiwa, halaman utama">
          <span className="brand-mark" aria-hidden="true">{site.shortBrand.mark}</span>
          <span>{site.shortBrand.first}<br /><em>{site.shortBrand.second}</em></span>
        </a>
        <nav className={styles.navLinks} aria-label="Navigasi utama">
          {navLinks.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>
        <div className={styles.actions}>
          {isStaff && (
            <Link className="header-cta" href="/karyawan/dashboard">Dashboard</Link>
          )}
          {session ? (
            <button className="header-cta" type="button" onClick={() => void signOut()}>Keluar</button>
          ) : (
            <button className="header-cta" type="button" onClick={() => openModal()}>
              Masuk <span aria-hidden="true">↗</span>
            </button>
          )}
          <button
            className={`${styles.menuToggle} ${menuOpen ? styles.menuToggleOpen : ""}`}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
      <nav
        id="mobile-menu"
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}
        aria-label="Navigasi mobile"
        aria-hidden={!menuOpen}
      >
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={closeMenu}>{link.label}</a>
        ))}
        <div className={styles.mobileActions}>
          <a className="primary-button" href="#booking" onClick={closeMenu}>
            Mulai konsultasi <span aria-hidden="true">↗</span>
          </a>
        </div>
      </nav>
    </header>
  );
}
