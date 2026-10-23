"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AppShell } from "./AppShell";

/**
 * App shell for the public landing page. Unlike PatientFrame there is no
 * session gate: the landing page stays public, signed-in users just see
 * their email and a sign-out action in the topbar.
 */
export function LandingShell({ children }: { children: ReactNode }) {
  const { session, isStaff, openModal, signOut } = useAuth();

  return (
    <AppShell
      variant={isStaff ? "staff" : "patient"}
      userLabel={session?.user.email}
      roleLabel={session ? (isStaff ? "Karyawan" : "Pasien") : undefined}
      onSignOut={session ? () => void signOut() : undefined}
      onSignIn={session ? undefined : () => openModal()}
    >
      {children}
    </AppShell>
  );
}
