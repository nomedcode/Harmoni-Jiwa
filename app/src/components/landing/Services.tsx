import Link from "next/link";
import { services } from "@/content/landing";
import { Reveal } from "./Reveal";
import styles from "./Services.module.css";

export function Services() {
  return (
    <section className={`wrap ${styles.section}`} id="layanan" aria-labelledby="services-title">
      <Reveal>
        <div className={styles.head}>
          <p className={styles.eyebrow}>Layanan kami</p>
          <h2 id="services-title">Cara kami mendampingi</h2>
          <p>Perawatan kesehatan mental profesional yang disesuaikan dengan kebutuhan dan tujuanmu.</p>
        </div>
      </Reveal>
      <ul className={styles.grid}>
        {services.map((service, index) => (
          <li key={service.key}>
            <Reveal delay={index * 90} className={styles.cardWrap}>
              <Link className={styles.card} href="/booking">
                <span className={styles.marker} aria-hidden="true" />
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <span className={styles.cardAction}>Buat janji →</span>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
