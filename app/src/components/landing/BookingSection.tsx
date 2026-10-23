import Link from "next/link";
import { officeHours } from "@/content/landing";
import { OpenStatus } from "./OpenStatus";
import styles from "./BookingSection.module.css";

export function BookingSection() {
  return (
    <section className={`wrap ${styles.section}`} id="booking" aria-labelledby="booking-title">
      <div className={styles.grid}>
        <div className={styles.intro}>
          <h2 id="booking-title">Jadwalkan sesi kamu</h2>
          <p>
            Pilih psikiater, tanggal, dan jam yang masih kosong. Permintaanmu masuk ke tim klinik dan kami
            konfirmasi lewat WhatsApp.
          </p>
          <Link className="primary-button" href="/booking">Buat janji</Link>
        </div>
        <div className={styles.hoursCard}>
          <div className={styles.hoursHead}>
            <h3>Jam operasional</h3>
            <OpenStatus />
          </div>
          <dl>
            {officeHours.map((item) => (
              <div className={styles.hoursRow} key={item.day}>
                <dt>{item.day}</dt>
                <dd className={styles.hoursTime}>{item.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
