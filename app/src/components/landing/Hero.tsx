import Link from "next/link";
import { officeHours } from "@/content/landing";
import { site } from "@/content/site";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.copy}>
        <h1 className={styles.title} id="hero-title">Tempat pulang untuk pikiranmu.</h1>
        <p className={styles.intro}>
          Percakapan yang aman, profesional, dan manusiawi untuk membantu kamu menjalani hari dengan lebih ringan.
        </p>
        <div className={styles.actions}>
          <Link className="primary-button" href="/booking">Mulai konsultasi</Link>
          <a className="secondary-button" href="#dokter">Kenali dokter kami</a>
        </div>
      </div>
      <div className={styles.panel}>
        <div className={styles.media} role="img" aria-label="Ilustrasi ruang konsultasi yang tenang">
          <div className={styles.lamp} />
          <div className={styles.sun} />
          <div className={styles.arch} />
          <div className={styles.plant} />
          <div className={styles.chair} />
        </div>
        <div className={styles.hours}>
          <h2 className={styles.hoursTitle}>Jam praktik</h2>
          <dl className={styles.hoursList}>
            {officeHours.map((entry) => (
              <div key={entry.day}>
                <dt>{entry.day}</dt>
                <dd>{entry.time}</dd>
              </div>
            ))}
          </dl>
          <Link className="primary-button" href="/booking">Buat janji sekarang</Link>
          <p className={styles.hoursNote}>Waktu klinik ({site.city}), konfirmasi lewat WhatsApp.</p>
        </div>
      </div>
    </section>
  );
}
