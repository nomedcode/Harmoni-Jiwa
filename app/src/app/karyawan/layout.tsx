import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard karyawan",
  description: "Ruang kerja internal untuk memantau appointment pasien.",
  robots: { index: false, follow: false },
};

export default function KaryawanLayout({ children }: LayoutProps<"/karyawan">) {
  return children;
}
