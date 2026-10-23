import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/booking" }));

import { AppShell } from "@/components/app/AppShell";

function navLinks() {
  return within(screen.getByRole("navigation", { name: "Navigasi aplikasi" })).getAllByRole("link");
}

describe("AppShell", () => {
  it("gives patients booking and appointment links without the staff dashboard", () => {
    render(<AppShell variant="patient">Isi</AppShell>);
    expect(screen.getByRole("link", { name: "Buat janji" })).toHaveAttribute("href", "/booking");
    expect(screen.getByRole("link", { name: "Janji saya" })).toHaveAttribute("href", "/janji-saya");
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("gives staff the dashboard link", () => {
    render(<AppShell variant="staff">Isi</AppShell>);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/karyawan/dashboard");
    expect(screen.queryByRole("link", { name: "Buat janji" })).not.toBeInTheDocument();
  });

  it("marks the current route", () => {
    render(<AppShell variant="patient">Isi</AppShell>);
    expect(screen.getByRole("link", { name: "Buat janji" })).toHaveAttribute("aria-current", "page");
    expect(navLinks().filter((link) => link.hasAttribute("aria-current"))).toHaveLength(1);
  });

  it("renders the content inside the main landmark and signs out on request", async () => {
    const onSignOut = vi.fn();
    const user = userEvent.setup();
    render(<AppShell variant="patient" userLabel="pasien@harmoni.test" onSignOut={onSignOut}>Isi halaman</AppShell>);

    expect(screen.getByRole("main")).toHaveTextContent("Isi halaman");
    expect(screen.getByText("pasien@harmoni.test")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keluar" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
