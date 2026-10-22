import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import { BookingFlow } from "@/components/booking/BookingFlow";

const doctors = [
  { id: 7, full_name: "dr. John Doe, Sp.KJ", role: "Psychiatrist" },
  { id: 8, full_name: "dr. Rina Maharani Kusumawardhani Prameswari, Sp.KJ", role: "Psychiatrist" },
];

async function fillPatient(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Nama lengkap/), "Pasien Uji");
  await user.type(screen.getByLabelText(/Nomor WhatsApp/), "08123456789");
  await user.selectOptions(screen.getByLabelText(/Jenis kelamin/), "F");
  await user.selectOptions(screen.getByLabelText(/Jenis konsultasi/), "Konsultasi awal");
  await user.click(screen.getByLabelText(/Saya setuju/));
}

describe("BookingFlow", () => {
  beforeEach(() => {
    // Monday 26 October 2026, 10:00 in Jakarta.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-10-26T10:00:00+07:00"));
    authState.session = null;
    authState.employees = [];
    openModal.mockReset();
    createAppointment.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  it("asks an anonymous visitor to sign in instead of posting the appointment", async () => {
    const user = setup();
    render(<BookingFlow />);

    await fillPatient(user);
    await user.click(screen.getByRole("button", { name: "Kirim permintaan" }));

    expect(openModal).toHaveBeenCalledWith("Masuk terlebih dahulu untuk membuat janji.");
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it("explains that the psychiatrist list is not available yet", () => {
    render(<BookingFlow />);
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByText(/Memuat daftar psikiater/)).toBeInTheDocument();
  });

  it("marks slots that already passed today and refuses to submit them", async () => {
    authState.session = { access_token: "token-123" };
    authState.employees = [doctors[0]];
    const user = setup();
    render(<BookingFlow />);

    const pastSlot = screen.getByRole("button", { name: "Pukul 09:00, lewat" });
    expect(pastSlot).toHaveAttribute("aria-disabled", "true");
    expect(pastSlot).toHaveAttribute("title", "Lewat");

    await user.click(pastSlot);
    expect(pastSlot).toHaveAttribute("aria-pressed", "false");
    await fillPatient(user);
    await user.click(screen.getByRole("button", { name: "Kirim permintaan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Pilih tanggal dan jam konsultasi di masa depan.");
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it("closes past days and Sundays with a reason that does not rely on colour", async () => {
    authState.session = { access_token: "token-123" };
    const user = setup();
    render(<BookingFlow />);

    expect(screen.getByRole("button", { name: "Minggu, 25 Oktober 2026, lewat" }))
      .toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("button", { name: "Bulan berikutnya" }));
    const sunday = screen.getByRole("button", { name: "Minggu, 1 November 2026, di luar jam praktik" });
    expect(sunday).toHaveAttribute("aria-disabled", "true");
    expect(sunday).toHaveAttribute("title", "Di luar jam praktik");
  });

  it("moves between days with the arrow keys", async () => {
    authState.session = { access_token: "token-123" };
    const user = setup();
    render(<BookingFlow />);

    const today = screen.getByRole("button", { name: "Senin, 26 Oktober 2026, hari ini" });
    expect(today).toHaveAttribute("aria-pressed", "true");
    today.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Selasa, 27 Oktober 2026" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Selasa, 27 Oktober 2026" })).toBeInTheDocument();
  });

  it("posts the same appointment payload and shows the success state", async () => {
    authState.session = { access_token: "token-123" };
    authState.employees = doctors;
    createAppointment.mockResolvedValue({ data: {} });
    const user = setup();
    render(<BookingFlow />);

    await user.click(screen.getByRole("radio", { name: /dr\. John Doe/ }));
    await user.click(screen.getByRole("button", { name: "Pukul 13:00" }));
    await fillPatient(user);
    await user.click(screen.getByRole("button", { name: "Kirim permintaan" }));

    await waitFor(() => expect(createAppointment).toHaveBeenCalledTimes(1));
    expect(createAppointment).toHaveBeenCalledWith({
      full_name: "Pasien Uji",
      gender: "F",
      phone_number: "08123456789",
      service_type: "Konsultasi awal",
      schedule: "2026-10-26 13:00",
      employee_id: 7,
    }, "token-123");
    expect(await screen.findByRole("heading", { name: "Permintaan terkirim." })).toHaveFocus();
    expect(screen.getByRole("link", { name: "Lihat janji saya" })).toHaveAttribute("href", "/janji-saya");
  });

  it("tells the patient to pick another slot when the backend reports a conflict", async () => {
    const { ApiError } = await import("@/lib/api");
    authState.session = { access_token: "token-123" };
    authState.employees = [doctors[0]];
    createAppointment.mockRejectedValue(new ApiError("Jadwal tersebut sudah tidak tersedia.", { kind: "http", status: 409, url: "/x" }));
    const user = setup();
    render(<BookingFlow />);

    await user.click(screen.getByRole("button", { name: "Pukul 14:30" }));
    await fillPatient(user);
    await user.click(screen.getByRole("button", { name: "Kirim permintaan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Jam itu baru saja diambil pasien lain.");
  });
});
