import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn();
const openModal = vi.fn();
const authState = {
  session: null as { access_token: string } | null,
  isStaff: false,
  openModal,
  signOut,
};

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => authState,
}));

import { navLinks } from "@/content/site";
import { SiteHeader } from "@/components/landing/SiteHeader";

describe("SiteHeader", () => {
  beforeEach(() => {
    authState.session = null;
    authState.isStaff = false;
    signOut.mockReset();
    openModal.mockReset();
  });

  it("shows the sign-in action for anonymous visitors", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    await user.click(screen.getByRole("button", { name: /Masuk/ }));
    expect(openModal).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("shows sign-out for a signed-in patient and hides the staff dashboard link", () => {
    authState.session = { access_token: "token" };
    render(<SiteHeader />);

    expect(screen.getByRole("button", { name: "Keluar" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("links staff to the dashboard", () => {
    authState.session = { access_token: "token" };
    authState.isStaff = true;
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "Dashboard" }))
      .toHaveAttribute("href", "/karyawan/dashboard");
  });

  it("uses Harmoni Jiwa as header brand", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: /Harmoni Jiwa/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /dr\. John Doe/ })).not.toBeInTheDocument();
  });

  it("keeps primary navigation in the requested order", () => {
    render(<SiteHeader />);
    const mainNavigation = screen.getByRole("navigation", { name: "Navigasi utama" });
    expect(within(mainNavigation).getAllByRole("link").map((link) => link.textContent))
      .toEqual(navLinks.map((link) => link.label));
  });

  it("toggles the mobile menu and keeps aria-expanded in sync", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    const toggle = screen.getByRole("button", { name: "Buka menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "mobile-menu");
    expect(document.getElementById("mobile-menu")).not.toHaveAttribute("hidden");
    expect(document.getElementById("mobile-menu")).toHaveAttribute("aria-hidden", "true");

    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Tutup menu" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Navigasi mobile" })).toHaveAttribute("aria-hidden", "false");
  });
});
