import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const closeModal = vi.fn();
const setMode = vi.fn();
const signIn = vi.fn();
const signUp = vi.fn();
const resendVerification = vi.fn();
const setPendingEmail = vi.fn();

const authState = {
  modalOpen: true,
  mode: "login" as "login" | "register",
  error: "",
  notice: "",
  pendingEmail: "",
  closeModal,
  setMode,
  setPendingEmail,
  signIn,
  signUp,
  resendVerification,
};

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => authState,
}));

import { AuthModal } from "@/components/auth/AuthModal";

describe("AuthModal", () => {
  beforeEach(() => {
    authState.modalOpen = true;
    authState.mode = "login";
    authState.error = "";
    authState.notice = "";
    authState.pendingEmail = "";
    closeModal.mockReset();
    setMode.mockReset();
    signIn.mockReset();
    signUp.mockReset();
    resendVerification.mockReset();
  });

  it("renders nothing while closed", () => {
    authState.modalOpen = false;
    render(<AuthModal />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("exposes a labelled modal dialog", () => {
    render(<AuthModal />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Selamat datang kembali.");
  });

  it("moves focus into the dialog on open", () => {
    render(<AuthModal />);
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<AuthModal />);
    await user.keyboard("{Escape}");
    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  it("signs in with the submitted credentials", async () => {
    const user = userEvent.setup();
    render(<AuthModal />);

    await user.type(screen.getByLabelText("Email"), "pasien@email.com");
    await user.type(screen.getByLabelText("Password"), "rahasia123");
    await user.click(screen.getByRole("button", { name: /^Masuk/ }));

    expect(signIn).toHaveBeenCalledWith("pasien@email.com", "rahasia123");
    expect(signUp).not.toHaveBeenCalled();
  });

  it("asks for a full name in register mode and calls signUp", async () => {
    authState.mode = "register";
    const user = userEvent.setup();
    render(<AuthModal />);

    await user.type(screen.getByLabelText(/Nama lengkap/), "Pasien Uji");
    await user.type(screen.getByLabelText("Email"), "baru@email.com");
    await user.type(screen.getByLabelText("Password"), "rahasia123");
    await user.click(screen.getByRole("button", { name: /Buat akun/ }));

    expect(signUp).toHaveBeenCalledWith("Pasien Uji", "baru@email.com", "rahasia123");
  });

  it("announces the error through an alert region", () => {
    authState.error = "Email atau password salah.";
    render(<AuthModal />);
    expect(screen.getByRole("alert")).toHaveTextContent("Email atau password salah.");
  });

  it("offers to resend verification once an email is pending", async () => {
    authState.pendingEmail = "baru@email.com";
    const user = userEvent.setup();
    render(<AuthModal />);

    await user.click(screen.getByRole("button", { name: /Kirim ulang email verifikasi/ }));
    expect(resendVerification).toHaveBeenCalledTimes(1);
  });

  it("switches to register mode", async () => {
    const user = userEvent.setup();
    render(<AuthModal />);
    await user.click(screen.getByRole("button", { name: /Belum punya akun/ }));
    expect(setMode).toHaveBeenCalledWith("register");
  });
});
