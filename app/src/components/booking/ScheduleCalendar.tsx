"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { ChevronIcon } from "@/components/app/icons";
import { schedules } from "@/content/landing";
import { site } from "@/content/site";
import { addDays, isClosedDay, slotState, weekdayOf, type ClinicMoment } from "@/lib/office-hours";
import styles from "./ScheduleCalendar.module.css";

/** How far ahead patients may request a consultation. */
export const MAX_DAYS_AHEAD = 60;

export type DayState = "available" | "past" | "closed" | "outside";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const dayReason: Record<Exclude<DayState, "available">, string> = {
  past: "Lewat",
  closed: "Di luar jam praktik",
  outside: "Belum dibuka untuk booking",
};

export function dayState(date: string, now: ClinicMoment): DayState {
  if (date < now.date) return "past";
  if (date > addDays(now.date, MAX_DAYS_AHEAD)) return "outside";
  if (isClosedDay(date)) return "closed";
  return schedules.some((time) => slotState(date, time, now) === "available") ? "available" : "past";
}

/** First date from today that still has an open slot. */
export function firstAvailableDate(now: ClinicMoment): string {
  for (let offset = 0; offset <= MAX_DAYS_AHEAD; offset += 1) {
    const date = addDays(now.date, offset);
    if (dayState(date, now) === "available") return date;
  }
  return now.date;
}

const utcDate = (date: string) => new Date(`${date}T00:00:00Z`);
const monthFormat = new Intl.DateTimeFormat(site.locale, { timeZone: "UTC", month: "long", year: "numeric" });
export const dayLabelFormat = new Intl.DateTimeFormat(site.locale, {
  timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric",
});

function monthDays(month: string): string[] {
  const [year, monthIndex] = month.split("-").map(Number);
  const count = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  return Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthIndex - 1 + delta, 1)).toISOString().slice(0, 7);
}

type ScheduleCalendarProps = {
  now: ClinicMoment;
  selectedDate: string;
  onSelect: (date: string) => void;
};

export function ScheduleCalendar({ now, selectedDate, onSelect }: ScheduleCalendarProps) {
  const [viewMonth, setViewMonth] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const month = viewMonth ?? selectedDate.slice(0, 7);
  const days = monthDays(month);
  const firstMonth = now.date.slice(0, 7);
  const lastMonth = addDays(now.date, MAX_DAYS_AHEAD).slice(0, 7);
  const leading = (weekdayOf(days[0]) + 6) % 7;
  const focusable = [activeDate, selectedDate].find((date) => date && days.includes(date))
    ?? days.find((date) => dayState(date, now) === "available")
    ?? days[0];

  function changeMonth(delta: number) {
    setViewMonth(shiftMonth(month, delta));
    setActiveDate(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    let target: string | undefined;
    if (step) target = addDays(date, step);
    if (event.key === "Home") target = days[0];
    if (event.key === "End") target = days[days.length - 1];
    if (!target) return;
    event.preventDefault();
    if (!days.includes(target)) return;
    setActiveDate(target);
    buttons.current.get(target)?.focus();
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.head}>
        <h3 className={styles.month} id="calendar-month" aria-live="polite">{monthFormat.format(utcDate(`${month}-01`))}</h3>
        <div className={styles.monthNav}>
          <button type="button" onClick={() => changeMonth(-1)} disabled={month <= firstMonth} aria-label="Bulan sebelumnya">
            <ChevronIcon direction="left" width={18} height={18} />
          </button>
          <button type="button" onClick={() => changeMonth(1)} disabled={month >= lastMonth} aria-label="Bulan berikutnya">
            <ChevronIcon width={18} height={18} />
          </button>
        </div>
      </div>
      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className={styles.grid} role="group" aria-labelledby="calendar-month">
        {leading > 0 && <span className={styles.spacer} style={{ gridColumn: `span ${leading}` }} />}
        {days.map((date) => {
          const state = dayState(date, now);
          const unavailable = state !== "available";
          const selected = date === selectedDate;
          const today = date === now.date;
          const reason = unavailable ? dayReason[state] : undefined;
          return (
            <button
              key={date}
              ref={(node) => {
                if (node) buttons.current.set(date, node);
                else buttons.current.delete(date);
              }}
              type="button"
              className={styles.day}
              data-state={state}
              data-today={today || undefined}
              aria-pressed={selected}
              aria-disabled={unavailable || undefined}
              aria-label={`${dayLabelFormat.format(utcDate(date))}${today ? ", hari ini" : ""}${reason ? `, ${reason.toLowerCase()}` : ""}`}
              title={reason}
              tabIndex={date === focusable ? 0 : -1}
              onKeyDown={(event) => handleKeyDown(event, date)}
              onFocus={() => setActiveDate(date)}
              onClick={() => {
                if (!unavailable) onSelect(date);
              }}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>
      <p className={styles.legend}>
        <span className={styles.legendStrike}>12</span> tidak bisa dipilih: sudah lewat, hari Minggu, atau lebih dari {MAX_DAYS_AHEAD} hari lagi.
      </p>
    </div>
  );
}
