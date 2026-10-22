import Link from "next/link";
import { services } from "@/content/landing";
import styles from "./Services.module.css";

export function Services() {
  return (
    <section className={`wrap ${styles.section}`} id="layanan" aria-labelledby="services-title">
      <div className={styles.head}>
        <h2 id="services-title">Ruang untuk menjadi lebih baik</h2>
        <p>Tiga jenis sesi. Kalau belum yakin yang mana, mulai dari konsultasi awal.</p>
      </div>
      <ul className={styles.list}>
        {services.map((service) => (
          <li key={service.key}>
            <Link className={styles.row} href="/booking">
              <span className={styles.marker} aria-hidden="true" />
              <div className={styles.rowText}>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </div>
              <span className={styles.rowAction} aria-hidden="true">Buat janji →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
