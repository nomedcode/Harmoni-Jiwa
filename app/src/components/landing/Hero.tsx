import Link from "next/link";
import { Reveal } from "./Reveal";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Reveal>
        <p className={styles.eyebrow}>Selamat datang di Harmoni Jiwa</p>
        <h1 className={styles.title} id="hero-title">Kamu berhak merasa bahagia.</h1>
        <p className={styles.intro}>
          Dampingan yang profesional dan penuh empati, disesuaikan dengan perjalanan kesehatan mentalmu.
        </p>
        <div className={styles.actions}>
          <Link className="primary-button" href="/booking">Mulai konsultasi</Link>
          <a className="secondary-button" href="#dokter">Kenali dokter kami</a>
        </div>
      </Reveal>
      <Reveal delay={140}>
        <div className={styles.media} role="img" aria-label="Ilustrasi ruang konsultasi yang tenang">
          <div className={styles.lamp} />
          <div className={styles.sun} />
          <div className={styles.arch} />
          <div className={styles.plant} />
          <div className={styles.chair} />
          <div className={`${styles.chip} ${styles.chipHere}`}>
            <span className={styles.chipIcon} aria-hidden="true" />
            <span className={styles.chipText}><strong>Kami di sini</strong><span>Jakarta Selatan</span></span>
          </div>
          <div className={`${styles.chip} ${styles.chipTrust}`}>
            <span className={styles.trustLabel}>500+ pasien mempercayai kami</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
