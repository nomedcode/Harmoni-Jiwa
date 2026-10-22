import { officeHours } from "@/content/landing";
import { site } from "@/content/site";

/** Consultations booked through the API last 60 minutes (AppointmentController::store). */
export const SESSION_MINUTES = 60;

/** Index 0 = Sunday, matching Date#getDay(). `officeHours` starts on Monday. */
const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export type DayHours = { opens: number; closes: number };

/** A point in time expressed as clinic wall-clock values. */
export type ClinicMoment = {
  /** YYYY-MM-DD */
  date: string;
  /** 0 = Sunday */
  weekday: number;
  /** Minutes since 00:00. */
  minutes: number;
};

export type SlotState = "available" | "past" | "closed";

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Parses "09:00 – 20:00" rows from the content module; "Tutup" yields null. */
export function hoursForWeekday(weekday: number): DayHours | null {
  const entry = officeHours.find((item) => item.day === DAY_NAMES[weekday]);
  const match = entry?.time.match(/(\d{2}:\d{2})\s*–\s*(\d{2}:\d{2})/);
  if (!match) return null;
  return { opens: toMinutes(match[1]), closes: toMinutes(match[2]) };
}

const momentFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: site.timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function clinicMoment(at: Date): ClinicMoment {
  const parts = Object.fromEntries(momentFormat.formatToParts(at).map((part) => [part.type, part.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return { date, weekday: weekdayOf(date), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** Weekday of a calendar date, independent of any timezone. */
export function weekdayOf(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function isOpenAt(at: Date): boolean {
  const now = clinicMoment(at);
  const hours = hoursForWeekday(now.weekday);
  return Boolean(hours && now.minutes >= hours.opens && now.minutes < hours.closes);
}

export type OpenStatusInfo =
  | { open: true; closes: string }
  | { open: false; nextDay: string; opens: string; today: boolean };

export function openStatus(at: Date): OpenStatusInfo {
  const now = clinicMoment(at);
  const hours = hoursForWeekday(now.weekday);
  if (hours && now.minutes >= hours.opens && now.minutes < hours.closes) {
    return { open: true, closes: toTime(hours.closes) };
  }
  if (hours && now.minutes < hours.opens) {
    return { open: false, nextDay: DAY_NAMES[now.weekday], opens: toTime(hours.opens), today: true };
  }
  for (let offset = 1; offset <= 7; offset += 1) {
    const weekday = (now.weekday + offset) % 7;
    const next = hoursForWeekday(weekday);
    if (next) return { open: false, nextDay: DAY_NAMES[weekday], opens: toTime(next.opens), today: false };
  }
  return { open: false, nextDay: "", opens: "", today: false };
}

/**
 * Whether a consultation can start at `time` on `date`. The whole session must
 * fit inside office hours; slots at or before the current clinic time are past.
 */
export function slotState(date: string, time: string, now: ClinicMoment): SlotState {
  const hours = hoursForWeekday(weekdayOf(date));
  const start = toMinutes(time);
  if (!hours || start < hours.opens || start + SESSION_MINUTES > hours.closes) return "closed";
  if (date < now.date || (date === now.date && start <= now.minutes)) return "past";
  return "available";
}

export function isClosedDay(date: string): boolean {
  return hoursForWeekday(weekdayOf(date)) === null;
}

/**
 * Laravel runs in UTC and stores the submitted "YYYY-MM-DD HH:mm" as-is, so the
 * UTC fields of `scheduled_at` are the clinic wall-clock time the patient picked.
 */
export function formatClinicSchedule(value: string | undefined, style: "full" | "date" | "time" = "full"): string {
  if (!value) return "Jadwal belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const options: Intl.DateTimeFormatOptions = { timeZone: "UTC" };
  if (style !== "time") Object.assign(options, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  if (style !== "date") Object.assign(options, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return new Intl.DateTimeFormat(site.locale, options).format(date);
}

/** Clinic calendar date (YYYY-MM-DD) of a stored `scheduled_at` value. */
export function scheduleDate(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/** True when the stored schedule is still ahead of the given clinic moment. */
export function isUpcoming(value: string | undefined, now: ClinicMoment): boolean {
  const date = scheduleDate(value);
  if (!date) return false;
  if (date !== now.date) return date > now.date;
  const stored = new Date(value!);
  return stored.getUTCHours() * 60 + stored.getUTCMinutes() > now.minutes;
}
