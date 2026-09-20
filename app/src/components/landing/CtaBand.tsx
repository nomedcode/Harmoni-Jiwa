import styles from "./CtaBand.module.css";

export function CtaBand() {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="cta-title">
      <div className={styles.band}>
        <h2 id="cta-title">Siap untuk merasa didampingi?</h2>
        <p>Jadwal tersedia minggu ini. Tidak perlu rujukan untuk pasien baru.</p>
        <a className="primary-button" href="#booking">Mulai konsultasi <span aria-hidden="true">↗</span></a>
      </div>
    </section>
  );
}
