import { describe, expect, it } from "vitest";
import {
  addDays,
  clinicMoment,
  formatClinicSchedule,
  isOpenAt,
  isUpcoming,
  openStatus,
  slotState,
  weekdayOf,
} from "@/lib/office-hours";

/** Wall-clock time in Jakarta (UTC+7, no daylight saving). */
const jakarta = (local: string) => new Date(`${local}:00+07:00`);

describe("isOpenAt", () => {
  it("is open on Monday at 10:00", () => {
    expect(isOpenAt(jakarta("2026-10-26T10:00"))).toBe(true);
  });

  it("is closed on Friday at 18:30", () => {
    expect(isOpenAt(jakarta("2026-10-23T18:30"))).toBe(false);
  });

  it("is closed all of Sunday", () => {
    expect(isOpenAt(jakarta("2026-10-25T11:00"))).toBe(false);
  });

  it("is closed on Saturday at 14:00", () => {
    expect(isOpenAt(jakarta("2026-10-24T14:00"))).toBe(false);
  });

  it("uses clinic time, not the UTC date", () => {
    // 23:30 UTC on Sunday is already Monday 06:30 in Jakarta.
    expect(clinicMoment(new Date("2026-10-25T23:30:00Z"))).toMatchObject({ date: "2026-10-26", weekday: 1 });
  });
});

describe("openStatus", () => {
  it("names the closing time while open", () => {
    expect(openStatus(jakarta("2026-10-26T10:00"))).toEqual({ open: true, closes: "20:00" });
  });

  it("points to Monday when closed on Sunday", () => {
    expect(openStatus(jakarta("2026-10-25T11:00"))).toMatchObject({ open: false, nextDay: "Senin", opens: "09:00" });
  });

  it("opens later the same day before 09:00", () => {
    expect(openStatus(jakarta("2026-10-26T07:15"))).toMatchObject({ open: false, today: true, opens: "09:00" });
  });
});

describe("slotState", () => {
  const now = clinicMoment(jakarta("2026-10-26T10:00"));

  it("marks earlier slots today as past", () => {
    expect(slotState("2026-10-26", "09:00", now)).toBe("past");
    expect(slotState("2026-10-26", "10:30", now)).toBe("available");
  });

  it("closes slots whose session would end after closing time", () => {
    expect(slotState("2026-10-31", "13:00", now)).toBe("available");
    expect(slotState("2026-10-31", "14:30", now)).toBe("closed");
  });

  it("closes every slot on Sunday", () => {
    expect(slotState("2026-11-01", "09:00", now)).toBe("closed");
  });
});

describe("calendar helpers", () => {
  it("computes weekdays and day offsets without timezone drift", () => {
    expect(weekdayOf("2026-10-26")).toBe(1);
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });
});

describe("stored schedules", () => {
  const stored = "2026-10-27T09:00:00.000000Z";

  it("shows the wall-clock time the patient picked", () => {
    expect(formatClinicSchedule(stored, "time")).toBe("09.00");
  });

  it("compares against the clinic clock", () => {
    expect(isUpcoming(stored, clinicMoment(jakarta("2026-10-27T08:59")))).toBe(true);
    expect(isUpcoming(stored, clinicMoment(jakarta("2026-10-27T09:00")))).toBe(false);
  });
});
