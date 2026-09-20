"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import {
  ApiError,
  formatApiError,
  listStaffAppointments,
  syncProfile,
  type ApiAppointment,
  type AuthRole,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { site } from "@/content/site";
import styles from "./dashboard.module.css";

type StaffAppointment = ApiAppointment & {
  id?: number;
  service_type?: string;
  scheduled_at?: string;
  status?: string;
  patient?: {
    full_name?: string;
    gender?: string;
    phone_number?: string;
    user?: { full_name?: string };
  };
  employee?: { full_name?: string; role?: string };
  queue?: { status?: string };
};

type StatusFilter = "all" | "requested" | "waiting" | "in_consultation" | "completed" | "cancelled" | "rejected";

const statusLabels: Record<string, string> = {
  requested: "Menunggu konfirmasi",
  waiting: "Menunggu antrean",
  in_consultation: "Sedang konsultasi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
};

const statusStyles: Record<string, string> = {
  requested: styles.statusRequested,
  waiting: styles.statusWaiting,
  in_consultation: styles.statusInConsultation,
  completed: styles.statusCompleted,
  cancelled: styles.statusCancelled,
  rejected: styles.statusRejected,
};

function isStaffRole(role: unknown): role is Exclude<AuthRole, "patient"> {
  return role === "karyawan" || role === "admin";
}

function formatSchedule(value?: string): string {
  if (!value) return "Jadwal belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(site.locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusFor(appointment: StaffAppointment): string {
  return appointment.queue?.status || appointment.status || "requested";
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [appointments, setAppointments] = useState<StaffAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!supabase) {
        setError("Supabase belum dikonfigurasi.");
        setLoading(false);
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      const nextSession = data.session;
      if (sessionError || !nextSession) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
        router.replace("/");
        return;
      }
      if (active) setSession(nextSession);

      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.error || !refreshed.data.session) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
        router.replace("/");
        return;
      }
      const activeSession = refreshed.data.session;

      try {
        const profile = await syncProfile({
          full_name: activeSession.user.user_metadata.full_name ?? activeSession.user.email ?? "Karyawan",
        }, activeSession.access_token);
        const nextRole = profile.data.role ?? "patient";
        if (!isStaffRole(nextRole)) {
          router.replace("/");
          return;
        }
        if (active) setRole(nextRole);

        const result = await listStaffAppointments(activeSession.access_token, page);
        if (!active) return;
        setAppointments(result.data as StaffAppointment[]);
        setTotal(typeof result.total === "number" ? result.total : result.data.length);
        setLastPage(typeof result.last_page === "number" ? result.last_page : 1);
        setError("");
      } catch (loadError) {
        if (!active) return;
        if (loadError instanceof ApiError && (loadError.status === 401 || loadError.status === 403)) {
          setError("Akun ini tidak memiliki akses dashboard karyawan.");
        } else {
          setError(formatApiError(loadError));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [page, router]);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const status = statusFor(appointment);
      const patient = appointment.patient?.full_name ?? "";
      const phone = appointment.patient?.phone_number ?? "";
      const service = appointment.service_type ?? "";
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch = !query || `${patient} ${phone} ${service}`.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [appointments, search, statusFilter]);

  const todayCount = appointments.filter((appointment) => {
    if (!appointment.scheduled_at) return false;
    const date = new Date(appointment.scheduled_at);
    return date.toDateString() === new Date().toDateString();
  }).length;

  async function signOut() {
    await supabase?.auth.signOut();
    router.replace("/");
  }

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#staff-main">Lewati ke konten utama</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className="brand" href="/" aria-label="Kembali ke halaman utama">
            <span className="brand-mark" aria-hidden="true">{site.shortBrand.mark}</span>
            <span>{site.shortBrand.first}<br /><em>{site.shortBrand.second}</em></span>
          </Link>
          <div className={styles.headerActions}>
            <span className={styles.rolePill}>{role === "admin" ? "Admin klinik" : "Karyawan klinik"}</span>
            <button className="header-cta" type="button" onClick={() => void signOut()}>Keluar</button>
          </div>
        </div>
      </header>

      <main className={styles.main} id="staff-main" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="staff-title">
          <div>
            <h1 id="staff-title">Dashboard<br /><i>appointment pasien.</i></h1>
            <p className={styles.intro}>
              Pantau jadwal dan informasi appointment seluruh pasien dalam satu tempat.
            </p>
          </div>
          <div className={styles.heroNote}>
            <span className={styles.noteMark} aria-hidden="true"></span>
            <div>
              <strong>Akses karyawan aktif</strong>
              <span className={styles.noteCaption}>Data diperbarui dari sistem klinik</span>
            </div>
          </div>
        </section>

        <div role="alert" aria-live="assertive">
          {error && <div className={styles.alert}>{error}</div>}
        </div>

        <section className={styles.statGrid} aria-label="Ringkasan appointment">
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Total appointment</span>
            <strong>{total}</strong>
          </article>
          <article className={`${styles.statCard} ${styles.statCardAccent}`}>
            <span className={styles.statLabel}>Jadwal hari ini</span>
            <strong>{todayCount}</strong>
          </article>
        </section>

        <section className={styles.panel} aria-labelledby="appointment-title">
          <div className={styles.panelHeading}>
            <h2 id="appointment-title">Semua appointment</h2>
          </div>
          <div className={styles.toolbar}>
            <label htmlFor="staff-search">
              Cari pasien, nomor, atau layanan
              <input
                id="staff-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ketik untuk mencari…"
              />
            </label>
            <label htmlFor="staff-status">
              Status
              <select
                id="staff-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                <option value="all">Semua status</option>
                <option value="requested">Menunggu konfirmasi</option>
                <option value="waiting">Menunggu antrean</option>
                <option value="in_consultation">Sedang konsultasi</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </label>
          </div>

          <div className={styles.tableWrap} aria-busy={loading}>
            {loading ? (
              <div className={styles.empty} role="status">
                <span className={styles.loadingDot} aria-hidden="true">●</span>
                <p>Memuat appointment pasien...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon} aria-hidden="true">—</span>
                <h3>Belum ada appointment</h3>
                <p>Coba ubah pencarian atau filter status.</p>
              </div>
            ) : (
              <table className={styles.table}>
                <caption className="visually-hidden">
                  {filteredAppointments.length} appointment, halaman {page} dari {lastPage}.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Pasien</th>
                    <th scope="col">Jadwal</th>
                    <th scope="col">Layanan</th>
                    <th scope="col">Dokter</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => {
                    const status = statusFor(appointment);
                    const accountName = appointment.patient?.user?.full_name;
                    return (
                      <tr key={appointment.id ?? `${appointment.scheduled_at}-${appointment.patient?.full_name}`}>
                        <td className={styles.cellTruncate}>
                          <strong className="truncate">{appointment.patient?.full_name ?? "Nama belum tersedia"}</strong>
                          <span className={`${styles.cellCaption} truncate`}>
                            {appointment.patient?.phone_number ?? "Nomor belum tersedia"}
                          </span>
                        </td>
                        <td className={styles.cellTruncate}>
                          <strong className="truncate">{formatSchedule(appointment.scheduled_at)}</strong>
                          {accountName && <span className={`${styles.cellCaption} truncate`}>Akun: {accountName}</span>}
                        </td>
                        <td className={styles.cellTruncate}><span className="truncate">{appointment.service_type ?? "—"}</span></td>
                        <td className={styles.cellTruncate}><span className="truncate">{appointment.employee?.full_name ?? "—"}</span></td>
                        <td>
                          <span className={`${styles.status} ${statusStyles[status] ?? ""}`}>
                            {statusLabels[status] ?? status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className={styles.pagination}>
            <span>{filteredAppointments.length} appointment · halaman {page} dari {lastPage}</span>
            <div className={styles.paginationButtons}>
              <button
                className="secondary-button"
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <span aria-hidden="true">←</span> Sebelumnya
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={page >= lastPage || loading}
                onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
              >
                Berikutnya <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
