"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useClinicNow } from "@/hooks/useClinicNow";
import { formatApiError, listAppointments, type ApiAppointment } from "@/lib/api";
import { clinicMoment, formatClinicSchedule, isUpcoming, type ClinicMoment } from "@/lib/office-hours";
import { roleLabel } from "@/lib/people";
import styles from "./MyAppointments.module.css";

export type PatientAppointment = ApiAppointment & {
  id?: number;
  service_type?: string;
  scheduled_at?: string;
  status?: string;
  employee?: { full_name?: string; role?: string };
};

type Tab = "upcoming" | "history";

const tabLabels: Record<Tab, string> = { upcoming: "Mendatang", history: "Riwayat" };

const STEPS = [
  { status: "requested", label: "Diminta" },
  { status: "confirmed", label: "Dikonfirmasi" },
  { status: "in_consultation", label: "Konsultasi" },
  { status: "completed", label: "Selesai" },
];

const endedLabels: Record<string, string> = {
  cancelled: "Dibatalkan",
  rejected: "Ditolak klinik",
};

const FINISHED = new Set(["completed", "cancelled", "rejected"]);

export function isHistory(appointment: PatientAppointment, now: ClinicMoment | null): boolean {
  const status = appointment.status ?? "requested";
  if (FINISHED.has(status)) return true;
  if (status === "in_consultation" || !now) return false;
  return !isUpcoming(appointment.scheduled_at, now);
}

export function StatusStepper({ status = "requested" }: { status?: string }) {
  if (endedLabels[status]) {
    return <p className={styles.ended}><span aria-hidden="true" />{endedLabels[status]}</p>;
  }
  const current = Math.max(0, STEPS.findIndex((step) => step.status === status));
  return (
    <ol className={styles.stepper} aria-label="Status janji">
      {STEPS.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "todo";
        return (
          <li key={step.status} data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span className={styles.stepDot} aria-hidden="true" />
            {step.label}
            {state === "done" && <span className="visually-hidden"> (sudah)</span>}
          </li>
        );
      })}
    </ol>
  );
}

type LoadResult = { key: string; data: PatientAppointment[]; lastPage: number } | { key: string; error: string };

export function MyAppointments() {
  const { session } = useAuth();
  const clock = useClinicNow();
  const now = clock ? clinicMoment(clock) : null;
  const [tab, setTab] = useState<Tab>("upcoming");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const tabs = useRef<Record<Tab, HTMLButtonElement | null>>({ upcoming: null, history: null });

  const token = session?.access_token;
  const requestKey = `${page}:${attempt}`;

  useEffect(() => {
    if (!token) return;
    let active = true;
    listAppointments(token, page)
      .then((response) => {
        if (!active) return;
        const lastPage = typeof response.last_page === "number" ? response.last_page : 1;
        setResult({ key: requestKey, data: response.data as PatientAppointment[], lastPage });
      })
      .catch((loadError: unknown) => {
        if (active) setResult({ key: requestKey, error: formatApiError(loadError) });
      });
    return () => {
      active = false;
    };
  }, [token, page, requestKey]);

  const loading = !result || result.key !== requestKey;
  const appointments = result && "data" in result ? result.data : [];
  const lastPage = result && "data" in result ? result.lastPage : 1;
  const groups: Record<Tab, PatientAppointment[]> = { upcoming: [], history: [] };
  appointments.forEach((appointment) => groups[isHistory(appointment, now) ? "history" : "upcoming"].push(appointment));
  const visible = tab === "upcoming"
    ? [...groups.upcoming].sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at)))
    : groups.history;

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next: Tab = tab === "upcoming" ? "history" : "upcoming";
    setTab(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className={styles.layout}>
      <div className={styles.tabs} role="tablist" aria-label="Kelompok janji">
        {(["upcoming", "history"] as Tab[]).map((value) => (
          <button
            key={value}
            ref={(node) => {
              tabs.current[value] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${value}`}
            aria-selected={tab === value}
            aria-controls="appointments-panel"
            tabIndex={tab === value ? 0 : -1}
            className={styles.tab}
            aria-label={loading ? undefined : `${tabLabels[value]}, ${groups[value].length} janji`}
            onClick={() => setTab(value)}
            onKeyDown={handleTabKey}
          >
            {tabLabels[value]}
            {!loading && <span className={styles.count} aria-hidden="true">{groups[value].length}</span>}
          </button>
        ))}
      </div>

      <div className={styles.panel} role="tabpanel" id="appointments-panel" aria-labelledby={`tab-${tab}`} aria-busy={loading}>
        {loading ? (
          <div className={styles.skeleton}>
            <span className="visually-hidden">Memuat janji…</span>
            <span className={styles.ghost} /><span className={styles.ghost} />
          </div>
        ) : result && "error" in result ? (
          <div className={styles.error} role="alert">
            <p><strong>Daftar janji belum bisa dimuat.</strong> {result.error}</p>
            <button className="secondary-button" type="button" onClick={() => setAttempt((count) => count + 1)}>
              Coba lagi
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <h2>{tab === "upcoming" ? "Belum ada janji mendatang" : "Riwayat masih kosong"}</h2>
            <p>
              {tab === "upcoming"
                ? "Pilih psikiater dan jam yang cocok, lalu kirim permintaan. Janji yang kamu buat muncul di sini."
                : "Janji yang sudah selesai, lewat, atau dibatalkan akan muncul di sini."}
            </p>
            {tab === "upcoming" && <Link className="primary-button" href="/booking">Buat janji</Link>}
          </div>
        ) : (
          <ul className={styles.list}>
            {visible.map((appointment) => (
              <li className={styles.card} key={appointment.id ?? appointment.scheduled_at}>
                <div className={styles.when}>
                  <strong>{formatClinicSchedule(appointment.scheduled_at, "date")}</strong>
                  <span>{formatClinicSchedule(appointment.scheduled_at, "time")} WIB</span>
                </div>
                <div className={styles.what}>
                  <h2>{appointment.service_type ?? "Konsultasi"}</h2>
                  <p>
                    {appointment.employee?.full_name ?? "Psikiater belum ditentukan"}
                    {appointment.employee?.role && `, ${roleLabel(appointment.employee.role)}`}
                  </p>
                </div>
                <StatusStepper status={appointment.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && lastPage > 1 && (
        <nav className={styles.pagination} aria-label="Halaman janji">
          <button className="secondary-button" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Sebelumnya
          </button>
          <span>Halaman {page} dari {lastPage}</span>
          <button className="secondary-button" type="button" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>
            Berikutnya
          </button>
        </nav>
      )}
    </div>
  );
}
