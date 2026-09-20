import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const openModal = vi.fn();
const authState = {
  session: null as { access_token: string } | null,
  employees: [] as { id: number; full_name: string; role: string }[],
  openModal,
};

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => authState,
}));

const createAppointment = vi.fn();
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, createAppointment: (...args: unknown[]) => createAppointment(...args) };
});

import { BookingForm, localDateString } from "@/components/landing/BookingForm";

function futureDateString(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return localDateString(date);
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, date: string) {
  await user.type(screen.getByLabelText(/Nama lengkap/), "Pasien Uji");
  await user.type(screen.getByLabelText(/Nomor WhatsApp/), "08123456789");
  await user.selectOptions(screen.getByLabelText(/Jenis kelamin/), "F");
  await user.selectOptions(screen.getByLabelText(/Jenis konsultasi/), "Konsultasi awal");
  const employeeSelect = screen.getByLabelText(/Psikiater/);
  if (!employeeSelect.hasAttribute("disabled")) await user.selectOptions(employeeSelect, "7");
  const dateInput = screen.getByLabelText(/Tanggal/);
  await user.clear(dateInput);
  await user.type(dateInput, date);
  await user.selectOptions(screen.getByLabelText(/^Jam/), "09:00");
  await user.click(screen.getByLabelText(/Saya setuju/));
}

describe("localDateString", () => {
  it("formats a date as YYYY-MM-DD in local time", () => {
    expect(localDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("BookingForm", () => {
  beforeEach(() => {
    authState.session = null;
    authState.employees = [];
    openModal.mockReset();
    createAppointment.mockReset();
  });

  it("asks an anonymous visitor to sign in instead of posting the appointment", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    await fillForm(user, futureDateString());
    await user.click(screen.getByRole("button", { name: /Kirim permintaan/ }));

    expect(openModal).toHaveBeenCalledWith("Masuk terlebih dahulu untuk membuat janji.");
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it("disables the psychiatrist select and explains why while no session exists", () => {
    render(<BookingForm />);
    expect(screen.getByLabelText(/Psikiater/)).toBeDisabled();
    expect(screen.getByText(/Masuk terlebih dahulu untuk memilih psikiater/)).toBeInTheDocument();
  });

  it("rejects a schedule that already passed today", async () => {
    // Native min/max validation would block a past date before React sees it,
    // so the clock is pinned late in the day and the earliest slot is chosen.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 0, 5, 23, 0, 0));
    try {
      authState.session = { access_token: "token-123" };
      authState.employees = [{ id: 7, full_name: "dr. John Doe", role: "psychiatrist" }];
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<BookingForm />);

      await fillForm(user, "2026-01-05");
      await user.click(screen.getByRole("button", { name: /Kirim permintaan/ }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Pilih tanggal dan jam konsultasi di masa depan.",
      );
      expect(createAppointment).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("posts the appointment and shows the success state", async () => {
    authState.session = { access_token: "token-123" };
    authState.employees = [{ id: 7, full_name: "dr. John Doe", role: "psychiatrist" }];
    createAppointment.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    render(<BookingForm />);

    const date = futureDateString();
    await fillForm(user, date);
    await user.click(screen.getByRole("button", { name: /Kirim permintaan/ }));

    await waitFor(() => expect(createAppointment).toHaveBeenCalledTimes(1));
    expect(createAppointment).toHaveBeenCalledWith({
      full_name: "Pasien Uji",
      gender: "F",
      phone_number: "08123456789",
      service_type: "Konsultasi awal",
      schedule: `${date} 09:00`,
      employee_id: 7,
    }, "token-123");
    expect(await screen.findByText("Permintaan terkirim.")).toBeInTheDocument();
  });
});
