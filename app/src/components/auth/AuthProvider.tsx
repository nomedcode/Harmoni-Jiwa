"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  ApiError,
  formatApiError,
  listEmployees,
  syncProfile as syncProfileRequest,
  type ApiEmployee,
  type AuthRole,
} from "@/lib/api";

export type AuthMode = "login" | "register";

type AuthContextValue = {
  session: Session | null;
  role: AuthRole;
  isStaff: boolean;
  /** Psychiatrists available for booking. Empty until the patient signs in. */
  employees: ApiEmployee[];
  modalOpen: boolean;
  mode: AuthMode;
  error: string;
  notice: string;
  pendingEmail: string;
  openModal: (message?: string) => void;
  closeModal: () => void;
  setMode: (mode: AuthMode) => void;
  setPendingEmail: (email: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: () => Promise<void>;
};

const PENDING_VERIFICATION_EMAIL_KEY = "pending-verification-email";

const AuthContext = createContext<AuthContextValue | null>(null);

function isInvalidRefreshToken(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /invalid refresh token|refresh token.*invalid/i.test(message);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AuthRole>("patient");
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const syncProfile = useCallback(async (nextSession: Session) => {
    try {
      const response = await syncProfileRequest({
        full_name:
          nextSession.user.user_metadata.full_name ?? nextSession.user.email ?? "Pasien",
      }, nextSession.access_token);
      const nextRole: AuthRole = response.data.role ?? "patient";
      setRole(nextRole);
      if (nextRole === "karyawan" || nextRole === "admin") router.push("/karyawan/dashboard");
    } catch (syncError) {
      console.error("Unable to sync the Supabase profile with Laravel.", syncError);
      setError(syncError instanceof ApiError && syncError.status === 401
        ? "Token Supabase ditolak Laravel. Silakan login ulang."
        : formatApiError(syncError));
    }
  }, [router]);

  // Restore the Supabase session and react to the email verification callback.
  useEffect(() => {
    const authClient = supabase;
    if (!authClient) return;

    let cancelled = false;
    const callbackParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const callbackErrorCode = callbackParams.get("error_code") ?? callbackParams.get("error");
    const storedEmail = window.sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY) ?? "";

    // The verification callback arrives in the URL hash. State updates are
    // deferred to a task so the effect body stays free of cascading renders.
    const callbackTimer = callbackErrorCode ? window.setTimeout(() => {
      if (cancelled) return;
      setModalOpen(true);
      setMode("login");
      setPendingEmail(storedEmail);
      setError(callbackErrorCode === "otp_expired"
        ? "Link verifikasi email sudah kedaluwarsa atau sudah pernah digunakan."
        : callbackParams.get("error_description") ?? "Verifikasi email tidak berhasil.");
      setNotice(storedEmail
        ? "Kirim ulang email verifikasi untuk mendapatkan link baru."
        : "Masukkan email saat daftar untuk meminta link verifikasi baru.");
    }, 0) : undefined;

    if (callbackErrorCode) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }

    async function clearStaleSession(message: string) {
      await authClient!.auth.signOut({ scope: "local" }).catch(() => undefined);
      if (cancelled) return;
      setSession(null);
      setRole("patient");
      setModalOpen(true);
      setMode("login");
      setError(message);
    }

    async function restoreSession() {
      const { data, error: sessionError } = await authClient!.auth.getSession();
      if (sessionError) {
        if (isInvalidRefreshToken(sessionError)) {
          await clearStaleSession("Sesi login lama sudah tidak valid. Silakan login kembali.");
        } else if (!cancelled) {
          setError(sessionError.message);
        }
        return;
      }

      if (!data.session) {
        if (!cancelled) setSession(null);
        return;
      }

      const refreshed = await authClient!.auth.refreshSession();
      if (refreshed.error) {
        if (isInvalidRefreshToken(refreshed.error)) {
          await clearStaleSession("Sesi login lama sudah tidak valid. Silakan login kembali.");
        } else if (!cancelled) {
          setError(refreshed.error.message);
        }
        return;
      }

      if (cancelled) return;
      const activeSession = refreshed.data.session ?? data.session;
      setSession(activeSession);
      void syncProfile(activeSession);
    }

    void restoreSession();
    const { data: listener } = authClient.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (nextSession && event !== "TOKEN_REFRESHED") void syncProfile(nextSession);
      else if (!nextSession) setRole("patient");
    });

    return () => {
      cancelled = true;
      if (callbackTimer !== undefined) window.clearTimeout(callbackTimer);
      listener.subscription.unsubscribe();
    };
  }, [syncProfile]);

  // The booking dropdown must use live psychiatrist ids from the API. The list
  // is cleared by the `session ? employees : []` projection below on logout.
  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;

    let cancelled = false;
    listEmployees(token)
      .then((response) => {
        if (!cancelled) setEmployees(response.data);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        console.error("Unable to load psychiatrist list.", loadError);
        setEmployees([]);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  const openModal = useCallback((message?: string) => {
    setModalOpen(true);
    setError(message ?? "");
    setNotice("");
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setError("");
    setNotice("");
  }, []);

  /** Switching between login and register must not keep the previous feedback. */
  const changeMode = useCallback((nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setNotice("");
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError("");
    setNotice("");
    if (!supabase) { setError("Supabase belum dikonfigurasi."); return; }
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) { setError(result.error.message); return; }
    window.sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
    setPendingEmail("");
    setModalOpen(false);
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string) => {
    setError("");
    setNotice("");
    if (!supabase) { setError("Supabase belum dikonfigurasi."); return; }
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (result.error) { setError(result.error.message); return; }
    setPendingEmail(email);
    window.sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email);
    setNotice("Cek email kamu untuk konfirmasi akun. Jika link kedaluwarsa, kirim ulang dari sini.");
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setRole("patient");
  }, []);

  const resendVerification = useCallback(async () => {
    if (!supabase || !pendingEmail) {
      setError("Masukkan email yang digunakan saat mendaftar terlebih dahulu.");
      return;
    }
    setError("");
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email: pendingEmail });
    if (resendError) { setError(resendError.message); return; }
    setNotice("Email verifikasi baru sudah dikirim. Gunakan link terbaru.");
  }, [pendingEmail]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    role,
    isStaff: Boolean(session) && (role === "karyawan" || role === "admin"),
    employees: session ? employees : [],
    modalOpen,
    mode,
    error,
    notice,
    pendingEmail,
    openModal,
    closeModal,
    setMode: changeMode,
    setPendingEmail,
    signIn,
    signUp,
    signOut,
    resendVerification,
  }), [
    session, role, employees, modalOpen, mode, error, notice, pendingEmail,
    openModal, closeModal, changeMode, signIn, signUp, signOut, resendVerification,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
