import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = { replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/karyawan/dashboard",
}));

const staffSession = { access_token: "staff-token", user: { email: "karyawan@harmoni.test", user_metadata: {} } };
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: staffSession }, error: null }),
      refreshSession: () => Promise.resolve({ data: { session: staffSession }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  },
}));

const syncProfile = vi.fn();
const listStaffAppointments = vi.fn();
const listQueues = vi.fn();
const updateAppointmentStatus = vi.fn();
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    syncProfile: (...args: unknown[]) => syncProfile(...args),
    listStaffAppointments: (...args: unknown[]) => listStaffAppointments(...args),
    listQueues: (...args: unknown[]) => listQueues(...args),
    updateAppointmentStatus: (...args: unknown[]) => updateAppointmentStatus(...args),
  };
});

import { ApiError } from "@/lib/api";
import EmployeeDashboard from "./page";

const doctor = { full_name: "dr. John Doe, Sp.KJ", role: "Psychiatrist" };
const requested = {
  id: 11,
  service_type: "Konsultasi awal",
  scheduled_at: "2026-10-26T13:00:00.000000Z",
  status: "requested",
  patient: { full_name: "Sari Wulandari", phone_number: "08123456789" },
  employee: doctor,
};

describe("EmployeeDashboard", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-10-26T10:00:00+07:00"));
    for (const mock of [syncProfile, listStaffAppointments, listQueues, updateAppointmentStatus]) mock.mockReset();
    syncProfile.mockResolvedValue({ data: { role: "karyawan" } });
    listStaffAppointments.mockResolvedValue({ data: [requested], total: 1, last_page: 1 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the appointment table usable when the queue fails to load", async () => {
    listQueues.mockRejectedValue(new ApiError("Gagal terhubung ke backend.", { kind: "network", url: "/queues" }));
    render(<EmployeeDashboard />);

    expect(await screen.findByText("Sari Wulandari")).toBeInTheDocument();
    expect(screen.getByText("Antrean belum bisa dimuat. Gagal terhubung ke backend.")).toBeInTheDocument();
    expect(screen.getByText("Senin, 26 Oktober 2026 pukul 13.00")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeEmptyDOMElement();
  });

  it("reloads the active queue after a status change", async () => {
    listQueues
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ id: 5, status: "waiting", appointment: { ...requested, status: "confirmed" } }] });
    updateAppointmentStatus.mockResolvedValue({ data: { status: "confirmed" } });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<EmployeeDashboard />);

    expect(await screen.findByText(/Belum ada pasien di antrean/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Ubah status janji Sari Wulandari"), "confirmed");

    const queue = screen.getByRole("region", { name: /Antrean aktif/ });
    expect(await within(queue).findByText("Sari Wulandari")).toBeInTheDocument();
    expect(within(queue).getByText("Menunggu antrean")).toBeInTheDocument();
    expect(updateAppointmentStatus).toHaveBeenCalledWith(11, { status: "confirmed" }, "staff-token");
    expect(listQueues).toHaveBeenCalledTimes(2);
  });
});
