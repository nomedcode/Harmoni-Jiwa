"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { site } from "@/content/site";
import { CalendarPlusIcon, DashboardIcon, HomeIcon, ListIcon, SignOutIcon } from "./icons";
import styles from "./AppShell.module.css";

export type AppShellVariant = "patient" | "staff";

type NavItem = { href: string; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> };

const navItems: Record<AppShellVariant, NavItem[]> = {
  patient: [
    { href: "/booking", label: "Buat janji", Icon: CalendarPlusIcon },
    { href: "/janji-saya", label: "Janji saya", Icon: ListIcon },
    { href: "/", label: "Beranda", Icon: HomeIcon },
  ],
  staff: [
    { href: "/karyawan/dashboard", label: "Dashboard", Icon: DashboardIcon },
  ],
};

type AppShellProps = {
  variant: AppShellVariant;
  /** Shown in the topbar, e.g. the signed-in email. */
  userLabel?: string;
  /** Short role description shown next to the user label. */
  roleLabel?: string;
  onSignOut?: () => void;
  /** Opened from the topbar when a visitor is not signed in. */
  onSignIn?: () => void;
  children: ReactNode;
};

export function AppShell({ variant, userLabel, roleLabel, onSignOut, onSignIn, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#app-main">Lewati ke konten utama</a>
      <nav className={styles.rail} aria-label="Navigasi aplikasi">
        <Link className={styles.brand} href="/" aria-label="Harmoni Jiwa, halaman utama">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mark, nothing to optimise */}
          <img src="/logo.svg" alt="" width={34} height={34} />
          <span className={styles.label}>{site.name}</span>
        </Link>
        <ul className={styles.items}>
          {navItems[variant].map(({ href, label, Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
            return (
              <li key={href}>
                <Link className={styles.item} href={href} aria-current={active ? "page" : undefined}>
                  <Icon className={styles.icon} />
                  <span className={styles.label}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={styles.body}>
        <header className={styles.topbar}>
          <span className={styles.title}>Harmoni Jiwa</span>
          <div className={styles.who}>
            {userLabel && <span className={styles.user}>{userLabel}</span>}
            {roleLabel && <span className={styles.role}>{roleLabel}</span>}
          </div>
          {onSignOut && (
            <button className={styles.signOut} type="button" onClick={onSignOut}>
              <SignOutIcon width={18} height={18} />
              Keluar
            </button>
          )}
          {!onSignOut && onSignIn && (
            <button className="header-cta" type="button" onClick={onSignIn}>
              Masuk
            </button>
          )}
        </header>
        <main className={styles.main} id="app-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
