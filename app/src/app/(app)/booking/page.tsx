import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking/BookingFlow";
import styles from "../page-head.module.css";

export const metadata: Metadata = {
  title: "Buat janji",
  description: "Pilih psikiater, tanggal, dan jam konsultasi di Harmoni Jiwa.",
  robots: { index: false, follow: false },
};

export default function BookingPage() {
  return (
    <>
      <header className={styles.head}>
        <h1>Buat janji konsultasi</h1>
        <p>Pilih psikiater dan waktu yang cocok. Kami mengonfirmasi lewat WhatsApp sebelum sesi.</p>
      </header>
      <BookingFlow />
    </>
  );
}
