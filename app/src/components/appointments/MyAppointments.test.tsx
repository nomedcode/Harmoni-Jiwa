import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ session: { access_token: "token-123" } }),
}));

const listAppointments = vi.fn();
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, listAppointments: (...args: unknown[]) => listAppointments(...args) };
});

import { ApiError } from "@/lib/api";
import { MyAppointments } from "@/components/appointments/MyAppointments";

const doctor = { full_name: "dr. John Doe, Sp.KJ", role: "Psychiatrist" };
const appointments = [
  { id: 1, service_type: "Konsultasi awal", scheduled_at: "2026-10-28T09:00:00.000000Z", status: "confirmed", employee: doctor },
  { id: 2, service_type: "Kecemasan & mood", scheduled_at: "2026-10-30T13:00:00.000000Z", status: "requested", employee: doctor },
  { id: 3, service_type: "Konsultasi remaja", scheduled_at: "2026-10-10T10:30:00.000000Z", status: "completed", employee: doctor },
  { id: 4, service_type: "Konsultasi awal", scheduled_at: "2026-11-02T09:00:00.000000Z", status: "cancelled", employee: doctor },
];

describe("MyAppointments", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-10-26T10:00:00+07:00"));
    listAppointments.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  it("splits appointments into upcoming and history tabs", async () => {
    listAppointments.mockResolvedValue({ data: appointments, last_page: 1 });
    const user = setup();
    render(<MyAppointments />);

    const upcomingTab = await screen.findByRole("tab", { name: "Mendatang, 2 janji" });
    expect(upcomingTab).toHaveAttribute("aria-selected", "true");
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent))
      .toEqual(["Konsultasi awal", "Kecemasan & mood"]);
    expect(listAppointments).toHaveBeenCalledWith("token-123", 1);

    await user.click(screen.getByRole("tab", { name: "Riwayat, 2 janji" }));
    expect(screen.getByRole("tab", { name: /Riwayat/ })).toHaveAttribute("aria-selected", "true");
    expect(within(screen.getByRole("tabpanel")).getByText("Konsultasi remaja")).toBeInTheDocument();
    expect(within(screen.getByRole("tabpanel")).getByText("Dibatalkan")).toBeInTheDocument();
  });

  it("switches tabs with the arrow keys", async () => {
    listAppointments.mockResolvedValue({ data: appointments, last_page: 1 });
    const user = setup();
    render(<MyAppointments />);

    (await screen.findByRole("tab", { name: /Mendatang/ })).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /Riwayat/ })).toHaveFocus();
    expect(screen.getByRole("tab", { name: /Riwayat/ })).toHaveAttribute("aria-selected", "true");
  });

  it("shows where each appointment is in the stepper", async () => {
    listAppointments.mockResolvedValue({ data: [appointments[0]], last_page: 1 });
    render(<MyAppointments />);

    const stepper = await screen.findByRole("list", { name: "Status janji" });
    const steps = within(stepper).getAllByRole("listitem");
    expect(steps.map((step) => step.dataset.state)).toEqual(["done", "current", "todo", "todo"]);
    expect(steps[1]).toHaveAttribute("aria-current", "step");
    expect(steps[1]).toHaveTextContent("Dikonfirmasi");
  });

  it("invites the patient to book when nothing is upcoming", async () => {
    listAppointments.mockResolvedValue({ data: [], last_page: 1 });
    render(<MyAppointments />);

    expect(await screen.findByRole("heading", { name: "Belum ada janji mendatang" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Buat janji" })).toHaveAttribute("href", "/booking");
  });

  it("explains a failed load and retries on request", async () => {
    listAppointments
      .mockRejectedValueOnce(new ApiError("Gagal terhubung ke backend.", { kind: "network", url: "/x" }))
      .mockResolvedValueOnce({ data: [appointments[1]], last_page: 1 });
    const user = setup();
    render(<MyAppointments />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Daftar janji belum bisa dimuat. Gagal terhubung ke backend.");
    await user.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(await screen.findByText("Kecemasan & mood")).toBeInTheDocument();
    expect(listAppointments).toHaveBeenCalledTimes(2);
  });
});
