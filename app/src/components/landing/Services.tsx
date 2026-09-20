import { secondaryServices, services } from "@/content/landing";
import styles from "./Services.module.css";

const toneClass = { dark: styles.cardDark, sage: styles.cardSage } as const;

export function Services() {
  return (
    <section className={`wrap ${styles.section}`} id="layanan" aria-labelledby="services-title">
      <div className={styles.head}>
        <h2 id="services-title">Ruang untuk</h2>
        <h2 className={styles.dim} aria-hidden="true">/</h2>
        <h2 className={styles.dim}>menjadi lebih baik</h2>
      </div>
      <div className={styles.bento}>
        {services.map((service) => (
          <a
            className={`${styles.card} ${service.size === "tall" ? styles.cardTall : ""}`}
            href="#booking"
            key={service.key}
          >
            <div>
              <h3>{service.title}</h3>
              <p className={styles.sub}>{service.text}</p>
            </div>
            <span className={styles.arrow} aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
      <div className={`${styles.bento} ${styles.bentoSecondary}`}>
        {secondaryServices.map((service) => (
          <a className={`${styles.card} ${toneClass[service.tone]}`} href="#booking" key={service.title}>
            <div>
              <h3>{service.title}</h3>
              <p className={styles.sub}>{service.sub}</p>
            </div>
            <span className={styles.arrow} aria-hidden="true">↗</span>
          </a>
        ))}
        <a className={`${styles.card} ${styles.cardOutline}`} href="#booking">
          <div>
            <h3>Lihat semua layanan</h3>
            <p className={styles.sub}>6 layanan tersedia</p>
          </div>
          <span className={`${styles.arrow} ${styles.arrowAccent}`} aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
