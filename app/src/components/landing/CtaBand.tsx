import Link from "next/link";
import { Reveal } from "./Reveal";
import styles from "./CtaBand.module.css";

export function CtaBand() {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="cta-title">
      <Reveal>
        <div className={styles.band}>
          <h2 id="cta-title">Siap untuk merasa didampingi?</h2>
          <p>Jadwal tersedia minggu ini. Tidak perlu rujukan untuk pasien baru.</p>
          <Link className="primary-button" href="/booking">Mulai konsultasi</Link>
        </div>
      </Reveal>
    </section>
  );
}
