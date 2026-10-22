import { services } from "@/content/landing";
import styles from "./Services.module.css";

export function Services() {
  return (
    <section className={`wrap ${styles.section}`} id="layanan" aria-labelledby="services-title">
      <div className={styles.head}>
        <h2 id="services-title">Ruang untuk</h2>
        <h2 className={styles.dim} aria-hidden="true">/</h2>
        <h2 className={styles.dim}>menjadi lebih baik</h2>
      </div>
      <div className={styles.bento}>
        {services.map((service, index) => (
          <a
            className={`${styles.card} ${index === 0 ? styles.cardTall : ""}`}
            href="#booking"
            key={service.key}
          >
            <div>
              <h3>{service.title}</h3>
              <p className={styles.sub}>{service.text}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
