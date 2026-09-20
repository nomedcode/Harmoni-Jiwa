import { site } from "@/content/site";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={`wrap ${styles.hero}`} aria-labelledby="hero-title">
      <h1 className={styles.title} id="hero-title">
        Tempat pulang<br /><i>untuk pikiranmu.</i>
      </h1>
      <p className={styles.intro}>
        Percakapan yang aman, profesional, dan manusiawi untuk membantu kamu menjalani hari dengan lebih ringan.
      </p>
      <div className={styles.actions}>
        <a className="primary-button" href="#booking">Mulai konsultasi <span aria-hidden="true">↗</span></a>
        <a className="secondary-button" href="#tentang">Kenali dokter kami</a>
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
        <a className={`${styles.chip} ${styles.chipMessage}`} href="#booking">
          <span className={styles.chipAvatar} aria-hidden="true">DA</span>
          <span className={styles.chipText}><strong>Hubungi kami</strong><span>Resepsionis</span></span>
        </a>
        <div className={`${styles.chip} ${styles.chipTrust}`}>
          <span className={styles.trustAvatars} aria-hidden="true">● ● ●</span>
          <span className={styles.trustLabel}>500+ pasien mempercayai kami</span>
        </div>
      </div>
    </section>
  );
}
