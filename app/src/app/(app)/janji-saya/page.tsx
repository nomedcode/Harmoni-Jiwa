import type { Metadata } from "next";
import { MyAppointments } from "@/components/appointments/MyAppointments";
import styles from "../page-head.module.css";

export const metadata: Metadata = {
  title: "Janji saya",
  description: "Status permintaan dan riwayat konsultasi kamu di Harmoni Jiwa.",
  robots: { index: false, follow: false },
};

export default function MyAppointmentsPage() {
  return (
    <>
      <header className={styles.head}>
        <h1>Janji saya</h1>
        <p>Permintaan baru berstatus diminta sampai tim klinik mengonfirmasi lewat WhatsApp.</p>
      </header>
      <MyAppointments />
    </>
  );
}
