import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doktor Personal | Ruang aman untuk bercerita",
  description: "Klinik psikiatri personal untuk konsultasi yang aman, profesional, dan manusiawi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="id"><body>{children}</body></html>;
}
