"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { bookingServices, schedules } from "@/content/landing";
import { ApiError, createAppointment, formatApiError } from "@/lib/api";
import styles from "./BookingSection.module.css";

/** Today's date in the browser timezone, formatted for <input type="date">. */
export function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BookingForm() {
  const { session, employees, openModal } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.access_token) {
      openModal("Masuk terlebih dahulu untuk membuat janji.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setError("");

    const employeeId = Number(formData.get("employee_id"));
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get("time") ?? "");
    const scheduledAt = new Date(`${date}T${time}:00`);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      setError("Pilih psikiater terlebih dahulu.");
      return;
    }

    if (!date || !time || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      setError("Pilih tanggal dan jam konsultasi di masa depan.");
      return;
    }

    setSubmitting(true);
    try {
      await createAppointment({
        full_name: String(formData.get("name") ?? ""),
        gender: formData.get("gender") as "M" | "F",
        phone_number: String(formData.get("phone") ?? ""),
        service_type: String(formData.get("service") ?? ""),
        schedule: `${date} ${time}`,
        employee_id: employeeId,
      }, session.access_token);
      setSubmitted(true);
    } catch (submitError) {
      console.error("Unable to create appointment with Laravel.", submitError);
      setError(submitError instanceof ApiError && submitError.status === 401
        ? "Sesi login sudah tidak valid. Silakan login ulang."
        : formatApiError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className={styles.formCard}>
        <div className={styles.success} role="status">
          <span className={styles.successIcon} aria-hidden="true">✓</span>
          <h3>Permintaan terkirim.</h3>
          <p>
            Terima kasih sudah memilih untuk mulai bercerita. Tim kami akan menghubungi kamu melalui
            WhatsApp.
          </p>
          <button className="text-button" type="button" onClick={() => setSubmitted(false)}>
            Buat janji lain ↗
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formCard}>
      <form onSubmit={handleSubmit}>
        <div className={styles.formHeader}>
          <span>01 / 03</span>
          <strong>{session ? "Data diri" : "Masuk untuk booking"}</strong>
        </div>
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
        <label htmlFor="booking-employee">
          Psikiater
          <select
            id="booking-employee"
            name="employee_id"
            defaultValue=""
            required
            disabled={employees.length === 0}
            aria-describedby="employee-hint"
          >
            <option value="" disabled>
              {employees.length === 0 ? "Memuat daftar psikiater…" : "Pilih psikiater"}
            </option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name} — {employee.role}
              </option>
            ))}
          </select>
        </label>
        {employees.length === 0 && (
          <p className="form-hint" id="employee-hint">
            {session
              ? "Daftar psikiater belum tersedia. Muat ulang halaman jika perlu."
              : "Masuk terlebih dahulu untuk memilih psikiater."}
          </p>
        )}
        <div className={styles.formRow}>
          <label htmlFor="booking-date">
            Tanggal
            <input id="booking-date" name="date" type="date" min={localDateString()} required />
          </label>
          <label htmlFor="booking-time">
            Jam
            <select id="booking-time" name="time" defaultValue="" required>
              <option value="" disabled>Pilih</option>
              {schedules.map((time) => <option key={time}>{time}</option>)}
            </select>
          </label>
        </div>
        <label className={styles.consent} htmlFor="booking-consent">
          <input id="booking-consent" type="checkbox" required />
          <span>Saya setuju menerima konfirmasi jadwal melalui WhatsApp.</span>
        </label>
        <div role="alert" aria-live="assertive">
          {error && <p className="form-error">{error}</p>}
        </div>
        <button className="primary-button form-submit" type="submit" disabled={submitting}>
          {submitting ? "Mengirim…" : "Kirim permintaan"} <span aria-hidden="true">↗</span>
        </button>
      </form>
    </div>
  );
}
