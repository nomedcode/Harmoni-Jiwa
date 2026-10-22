import Link from "next/link";
import { services } from "@/content/landing";
import styles from "./Services.module.css";

export function Services() {
  const [lead, ...rest] = services;

  return (
    <section className={`wrap ${styles.section}`} id="layanan" aria-labelledby="services-title">
      <div className={styles.head}>
        <h2 id="services-title">Ruang untuk menjadi lebih baik</h2>
        <p>Tiga jenis sesi. Kalau belum yakin yang mana, mulai dari konsultasi awal.</p>
      </div>
      <div className={styles.layout}>
        <Link className={styles.lead} href="/booking">
          <h3>{lead.title}</h3>
          <p>{lead.text}</p>
          <span className={styles.leadAction}>Buat janji</span>
        </Link>
        <ul className={styles.rest}>
          {rest.map((service) => (
            <li key={service.key}>
              <Link className={styles.row} href="/booking">
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
