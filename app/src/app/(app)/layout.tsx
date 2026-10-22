import type { ReactNode } from "react";
import { PatientFrame } from "@/components/app/PatientFrame";
import { AuthModal } from "@/components/auth/AuthModal";
import { AuthProvider } from "@/components/auth/AuthProvider";

export default function PatientAppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PatientFrame>{children}</PatientFrame>
      <AuthModal />
    </AuthProvider>
  );
}
