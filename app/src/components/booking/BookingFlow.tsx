"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { CheckIcon, SearchIcon } from "@/components/app/icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { bookingServices, schedules } from "@/content/landing";
import { site } from "@/content/site";
import { useClinicNow } from "@/hooks/useClinicNow";
import { ApiError, createAppointment, formatApiError } from "@/lib/api";
import { clinicMoment, SESSION_MINUTES, slotState, type ClinicMoment, type SlotState } from "@/lib/office-hours";
import { initials, roleLabel } from "@/lib/people";
import { dayLabelFormat, firstAvailableDate, ScheduleCalendar } from "./ScheduleCalendar";
import styles from "./BookingFlow.module.css";

const slotReason: Record<Exclude<SlotState, "available">, string> = {
  past: "Lewat",
  closed: "Di luar jam praktik",
};

export function BookingFlow() {
  const now = useClinicNow();

  if (!now) {
    return <div className={styles.pending} aria-busy="true"><span className="visually-hidden">Menyiapkan kalender…</span></div>;
  }
  return <BookingSteps now={clinicMoment(now)} />;
}

function BookingSteps({ now }: { now: ClinicMoment }) {
  const { session, employees, openModal } = useAuth();
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [pick, setPick] = useState<{ date: string; time: string } | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const defaultDate = useMemo(() => firstAvailableDate(now), [now]);
  const date = pickedDate ?? defaultDate;
  const time = pick?.date === date ? pick.time : "";
  const chosenDoctorId = doctorId ?? (employees.length === 1 ? employees[0].id : null);
  const doctor = employees.find((employee) => employee.id === chosenDoctorId);
  const needle = query.trim().toLocaleLowerCase(site.locale);
  const visibleDoctors = needle
    ? employees.filter((employee) => employee.full_name.toLocaleLowerCase(site.locale).includes(needle))
    : employees;
  const dayLabel = dayLabelFormat.format(new Date(`${date}T00:00:00Z`));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.access_token) {
      openModal("Masuk terlebih dahulu untuk membuat janji.");
      return;
    }

    setError("");
    if (!chosenDoctorId) {
      setError("Pilih psikiater terlebih dahulu.");
      return;
    }
    if (!time || slotState(date, time, now) !== "available") {
      setError("Pilih tanggal dan jam konsultasi di masa depan.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await createAppointment({
        full_name: String(formData.get("name") ?? ""),
        gender: formData.get("gender") as "M" | "F",
        phone_number: String(formData.get("phone") ?? ""),
        service_type: String(formData.get("service") ?? ""),
        schedule: `${date} ${time}`,
        employee_id: chosenDoctorId,
      }, session.access_token);
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof ApiError && submitError.status === 401
        ? "Sesi login sudah tidak valid. Keluar, lalu masuk lagi."
        : submitError instanceof ApiError && submitError.status === 409
          ? "Jam itu baru saja diambil pasien lain. Pilih jam lain, lalu kirim lagi."
          : formatApiError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className={styles.success} role="status" aria-labelledby="booking-success">
        <span className={styles.successIcon} aria-hidden="true"><CheckIcon /></span>
        <h2 id="booking-success" tabIndex={-1} ref={(heading) => heading?.focus()}>Permintaan terkirim.</h2>
        <p>
          Sesi dengan {doctor?.full_name} pada {dayLabel}, pukul {time} WIB. Tim kami akan mengonfirmasi jadwal
          lewat WhatsApp.
        </p>
        <div className={styles.successActions}>
          <Link className="primary-button" href="/janji-saya">Lihat janji saya</Link>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setSubmitted(false);
              setPick(null);
            }}
          >
            Buat janji lain
          </button>
        </div>
      </section>
    );
  }

  return (
    <form className={styles.flow} onSubmit={handleSubmit} aria-describedby="booking-error">
      <fieldset className={`${styles.step} ${styles.timeStep}`}>
        <legend className={styles.stepTitle}><span aria-hidden="true">1</span>Pilih tanggal dan jam</legend>
        <div className={styles.timePanel}>
          <ScheduleCalendar now={now} selectedDate={date} onSelect={setPickedDate} />
          <div className={styles.slots}>
            <h3 id="slot-title">{dayLabel}</h3>
            <p className={styles.slotHint}>Sesi {SESSION_MINUTES} menit, waktu klinik (WIB).</p>
            <div className={styles.slotList} role="group" aria-labelledby="slot-title">
              {schedules.map((slot) => {
                const state = slotState(date, slot, now);
                const unavailable = state !== "available";
                const reason = unavailable ? slotReason[state] : undefined;
                return (
                  <button
                    key={slot}
                    type="button"
                    className={styles.slot}
                    data-state={state}
                    aria-pressed={slot === time}
                    aria-disabled={unavailable || undefined}
                    aria-label={`Pukul ${slot}${reason ? `, ${reason.toLowerCase()}` : ""}`}
                    title={reason}
                    onClick={() => {
                      if (!unavailable) setPick({ date, time: slot });
                    }}
                  >
                    <span className={styles.slotTime}>{slot}</span>
                    {reason && <span className={styles.slotReason}>{reason}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.step}>
        <legend className={styles.stepTitle}><span aria-hidden="true">2</span>Pilih psikiater</legend>
        {employees.length === 0 ? (
          <p className="form-hint">Memuat daftar psikiater… Jika daftar tidak muncul, muat ulang halaman.</p>
        ) : (
          <>
            <label className={styles.search} htmlFor="doctor-search">
              <span className="visually-hidden">Cari psikiater</span>
              <SearchIcon className={styles.searchIcon} width={18} height={18} />
              <input
                id="doctor-search"
                type="search"
                placeholder="Cari nama psikiater"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
              />
            </label>
            {visibleDoctors.length === 0 && (
              <p className="form-hint">Tidak ada psikiater dengan nama “{query.trim()}”.</p>
            )}
            <div className={styles.doctors}>
              {visibleDoctors.map((employee) => (
                <label className={styles.doctor} key={employee.id}>
                  <input
                    type="radio"
                    name="employee_id"
                    value={employee.id}
                    checked={employee.id === chosenDoctorId}
                    onChange={() => setDoctorId(employee.id)}
                  />
                  <span className={styles.avatar} aria-hidden="true">{initials(employee.full_name)}</span>
                  <span className={styles.doctorText}>
                    <strong>{employee.full_name}</strong>
                    <span>{roleLabel(employee.role)}</span>
                  </span>
                  <span className={styles.pickLabel} aria-hidden="true">
                    {employee.id === chosenDoctorId ? <><CheckIcon width={16} height={16} />Dipilih</> : "Pilih"}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </fieldset>

      <aside className={styles.detail} aria-labelledby="detail-title">
        <h2 id="detail-title">Detail psikiater</h2>
        {doctor ? (
          <div className={styles.profile}>
            <span className={styles.portrait} aria-hidden="true">{initials(doctor.full_name)}</span>
            <p className={styles.profileName}>{doctor.full_name}</p>
            <p className={styles.profileRole}>{roleLabel(doctor.role)}</p>
          </div>
        ) : (
          <p className={styles.profileEmpty}>Pilih psikiater dari daftar untuk melihat detail dan melanjutkan.</p>
        )}
        <dl className={styles.summary}>
          <div><dt>Tanggal</dt><dd>{dayLabel}</dd></div>
          <div><dt>Jam</dt><dd>{time ? `${time} WIB, ${SESSION_MINUTES} menit` : "Belum dipilih"}</dd></div>
        </dl>

        <fieldset className={styles.step}>
          <legend className={styles.stepTitle}><span aria-hidden="true">3</span>Data diri</legend>
          <div className={styles.fields}>
            <label htmlFor="booking-name">
              Nama lengkap
              <input id="booking-name" name="name" placeholder="Nama kamu" maxLength={100} autoComplete="name" required />
            </label>
            <label htmlFor="booking-phone">
              Nomor WhatsApp
              <input
                id="booking-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                maxLength={13}
                placeholder="08xx xxxx xxxx"
                autoComplete="tel"
                spellCheck={false}
                required
              />
            </label>
            <label htmlFor="booking-gender">
              Jenis kelamin
              <select id="booking-gender" name="gender" defaultValue="" required>
                <option value="" disabled>Pilih</option>
                <option value="M">Laki-laki</option>
                <option value="F">Perempuan</option>
              </select>
            </label>
            <label htmlFor="booking-service">
              Jenis konsultasi
              <select id="booking-service" name="service" defaultValue="" required>
                <option value="" disabled>Pilih layanan</option>
                {bookingServices.map((service) => <option key={service}>{service}</option>)}
              </select>
            </label>
          </div>
        </fieldset>

        <label className={styles.consent} htmlFor="booking-consent">
          <input id="booking-consent" type="checkbox" required />
          <span>Saya setuju menerima konfirmasi jadwal melalui WhatsApp.</span>
        </label>
        <div id="booking-error" role="alert" aria-live="assertive">
          {error && <p className="form-error">{error}</p>}
        </div>
        <button className="primary-button form-submit" type="submit" disabled={submitting}>
          {submitting ? "Mengirim…" : "Kirim permintaan"}
        </button>
      </aside>
    </form>
  );
}
