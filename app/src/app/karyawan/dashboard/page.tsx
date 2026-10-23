"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import {
  ApiError,
  deleteAppointment,
  formatApiError,
  listQueues,
  listStaffAppointments,
  syncProfile,
  updateAppointmentStatus,
  type ApiAppointment,
  type AppointmentStatus,
  type AuthRole,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/app/AppShell";
import { useClinicNow } from "@/hooks/useClinicNow";
import { clinicMoment, formatClinicSchedule, scheduleDate } from "@/lib/office-hours";
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

type ActiveQueue = {
  id?: number;
  status?: string;
  appointment?: StaffAppointment;
};

type StatusFilter = "all" | "requested" | "confirmed" | "in_consultation" | "completed" | "cancelled" | "rejected";

const statusLabels: Record<string, string> = {
  requested: "Menunggu konfirmasi",
  confirmed: "Dikonfirmasi",
  waiting: "Menunggu antrean",
  in_consultation: "Sedang konsultasi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
};

const statusStyles: Record<string, string> = {
  requested: styles.statusRequested,
  confirmed: styles.statusConfirmed,
  waiting: styles.statusWaiting,
  in_consultation: styles.statusInConsultation,
  completed: styles.statusCompleted,
  cancelled: styles.statusCancelled,
  rejected: styles.statusRejected,
};

function isStaffRole(role: unknown): role is Exclude<AuthRole, "patient"> {
  return role === "karyawan" || role === "admin";
}

function statusFor(appointment: StaffAppointment): string {
  // Appointment status is the single source of truth; the queue row mirrors it
  // (kept in sync by the backend) and is only exposed via GET /queues.
  return appointment.status || "requested";
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [appointments, setAppointments] = useState<StaffAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [queues, setQueues] = useState<ActiveQueue[] | null>(null);
  const [queueError, setQueueError] = useState("");
  const now = useClinicNow();

  const loadQueues = useCallback(async (accessToken: string) => {
    try {
      const result = await listQueues(accessToken);
      setQueues(result.data as ActiveQueue[]);
      setQueueError("");
    } catch (queueFailure) {
      setQueueError(formatApiError(queueFailure));
    }
  }, []);

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
        void loadQueues(activeSession.access_token);

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
  }, [page, router, loadQueues]);

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

  const today = now ? clinicMoment(now).date : null;
  const todayCount = today
    ? appointments.filter((appointment) => scheduleDate(appointment.scheduled_at) === today).length
    : null;

  const activeQueues = useMemo(
    () =>
      [...(queues ?? [])].sort((a, b) =>
        (a.appointment?.scheduled_at ?? "").localeCompare(b.appointment?.scheduled_at ?? ""),
      ),
    [queues],
  );

  async function signOut() {
    await supabase?.auth.signOut();
    router.replace("/");
  }

  async function changeStatus(appointment: StaffAppointment, status: AppointmentStatus) {
    if (!session?.access_token || !appointment.id || busyId) return;
    setBusyId(appointment.id);
    setActionError("");
    try {
      const result = await updateAppointmentStatus(appointment.id, { status }, session.access_token);
      const updated = (result.data ?? {}) as StaffAppointment;
      setAppointments((current) =>
        current.map((item) => (item.id === appointment.id ? { ...item, ...updated, id: appointment.id } : item)),
      );
      void loadQueues(session.access_token);
    } catch (actionFailure) {
      setActionError(formatApiError(actionFailure));
    } finally {
      setBusyId(null);
    }
  }

  async function removeAppointment(appointment: StaffAppointment) {
    if (!session?.access_token || !appointment.id || busyId) return;
    const label = appointment.patient?.full_name ?? "pasien ini";
    if (!window.confirm(`Hapus janji ${label}? Tindakan ini permanen.`)) return;
    setBusyId(appointment.id);
    setActionError("");
    try {
      await deleteAppointment(appointment.id, session.access_token);
      setAppointments((current) => current.filter((item) => item.id !== appointment.id));
      setTotal((current) => Math.max(0, current - 1));
      void loadQueues(session.access_token);
    } catch (actionFailure) {
      setActionError(formatApiError(actionFailure));
    } finally {
      setBusyId(null);
    }
  }

  const roleLabel = role ? (role === "admin" ? "Admin klinik" : "Karyawan klinik") : undefined;

  return (
    <AppShell
      variant="staff"
      userLabel={role ? session?.user.email : undefined}
      roleLabel={roleLabel}
      onSignOut={() => void signOut()}
    >
      <div className={styles.head}>
        <h1>Janji pasien</h1>
        <p>Konfirmasi permintaan baru, pantau antrean hari ini, dan perbarui status setelah sesi.</p>
      </div>

      <div role="alert" aria-live="assertive">
        {(error || actionError) && <div className={styles.alert}>{actionError || error}</div>}
      </div>

      {!role ? (
        !error && (
          <div className={styles.skeleton} aria-busy="true">
            <span className="visually-hidden">Memeriksa akses karyawan…</span>
            <span className={styles.ghost} />
            <span className={`${styles.ghost} ${styles.ghostTall}`} />
          </div>
        )
      ) : (
        <div className={styles.layout}>
          <dl className={styles.stats}>
            <div>
              <dt>Total janji</dt>
              <dd>{loading ? "–" : total}</dd>
            </div>
            <div>
              <dt>Jadwal hari ini</dt>
              <dd>{loading || todayCount === null ? "–" : todayCount}</dd>
            </div>
          </dl>

          <section className={styles.queue} aria-labelledby="queue-title">
            <h2 id="queue-title">
              Antrean aktif
              {queues !== null && !queueError && <span className={styles.count}>{activeQueues.length}</span>}
            </h2>
            {queueError ? (
              <div className={styles.queueNote}>
                <p>Antrean belum bisa dimuat. {queueError}</p>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => session && void loadQueues(session.access_token)}
                >
                  Coba lagi
                </button>
              </div>
            ) : queues === null ? (
              <p className={styles.queueNote} aria-busy="true">Memuat antrean…</p>
            ) : activeQueues.length === 0 ? (
              <p className={styles.queueNote}>Belum ada pasien di antrean. Janji yang dikonfirmasi masuk ke sini.</p>
            ) : (
              <ol className={styles.queueList}>
                {activeQueues.map((queue) => (
                  <li key={queue.id} data-status={queue.status}>
                    <span className={styles.queueTime}>{formatClinicSchedule(queue.appointment?.scheduled_at, "time")}</span>
                    <span className={styles.queueWho}>
                      <strong>{queue.appointment?.patient?.full_name ?? "Nama belum tersedia"}</strong>
                      <span>
                        {formatClinicSchedule(queue.appointment?.scheduled_at, "date")}
                        {queue.appointment?.employee?.full_name ? ` · ${queue.appointment.employee.full_name}` : ""}
                      </span>
                    </span>
                    <span className={`${styles.status} ${statusStyles[queue.status ?? ""] ?? ""}`}>
                      {statusLabels[queue.status ?? ""] ?? queue.status}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="appointment-title">
            <h2 id="appointment-title">Semua janji</h2>
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
                  <option value="confirmed">Dikonfirmasi</option>
                  <option value="in_consultation">Sedang konsultasi</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </label>
            </div>

            <div className={styles.tableWrap} aria-busy={loading}>
              {loading ? (
                <div className={styles.empty} role="status">
                  <p>Memuat janji pasien…</p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className={styles.empty}>
                  <h3>Belum ada janji</h3>
                  <p>Coba ubah pencarian atau filter status.</p>
                </div>
              ) : (
                <table className={styles.table}>
                  <caption className="visually-hidden">
                    {filteredAppointments.length} janji, halaman {page} dari {lastPage}.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Pasien</th>
                      <th scope="col">Jadwal</th>
                      <th scope="col">Layanan</th>
                      <th scope="col">Dokter</th>
                      <th scope="col">Status</th>
                      <th scope="col">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((appointment) => {
                      const status = statusFor(appointment);
                      return (
                        <tr key={appointment.id ?? `${appointment.scheduled_at}-${appointment.patient?.full_name}`}>
                          <td className={styles.cellPatient} data-label="Pasien">
                            <strong>{appointment.patient?.full_name ?? "Nama belum tersedia"}</strong>
                            <span className={styles.cellCaption}>
                              {appointment.patient?.phone_number ?? "Nomor belum tersedia"}
                            </span>
                          </td>
                          <td data-label="Jadwal">{formatClinicSchedule(appointment.scheduled_at)}</td>
                          <td data-label="Layanan">{appointment.service_type ?? "—"}</td>
                          <td data-label="Dokter">{appointment.employee?.full_name ?? "—"}</td>
                          <td data-label="Status">
                            <span className={`${styles.status} ${statusStyles[status] ?? ""}`}>
                              {statusLabels[status] ?? status}
                            </span>
                          </td>
                          <td data-label="Aksi">
                            <div className={styles.rowActions}>
                              <select
                                className={styles.statusSelect}
                                aria-label={`Ubah status janji ${appointment.patient?.full_name ?? ""}`}
                                value={appointment.status ?? "requested"}
                                disabled={busyId === appointment.id}
                                onChange={(event) => void changeStatus(appointment, event.target.value as AppointmentStatus)}
                              >
                                {([
                                  "requested",
                                  "confirmed",
                                  "in_consultation",
                                  "completed",
                                  "cancelled",
                                  "rejected",
                                ] as AppointmentStatus[]).map((value) => (
                                  <option key={value} value={value}>{statusLabels[value] ?? value}</option>
                                ))}
                              </select>
                              <button
                                className={styles.deleteButton}
                                type="button"
                                disabled={busyId === appointment.id}
                                onClick={() => void removeAppointment(appointment)}
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className={styles.pagination}>
              <span>{filteredAppointments.length} janji · halaman {page} dari {lastPage}</span>
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
                  className="secondary-button"
                  type="button"
                  disabled={page >= lastPage || loading}
                  onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
                >
                  Berikutnya <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
