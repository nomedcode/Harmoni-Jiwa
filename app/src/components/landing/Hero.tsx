import Link from "next/link";
import { site } from "@/content/site";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={`wrap ${styles.hero}`} aria-labelledby="hero-title">
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
      <div className={styles.media} role="img" aria-label="Ilustrasi ruang konsultasi yang tenang">
        <div className={styles.sun} />
        <div className={styles.arch} />
        <div className={styles.plant} />
        <div className={styles.chair} />
        <div className={`${styles.chip} ${styles.chipHere}`}>
          <span className={styles.chipIcon} aria-hidden="true" />
          <span className={styles.chipText}><strong>Kami di sini</strong><span>{site.city}</span></span>
        </div>
        <div className={`${styles.chip} ${styles.chipTrust}`}>
          <span className={styles.trustLabel}>500+ pasien mempercayai kami</span>
        </div>
      </div>
    </section>
  );
}
