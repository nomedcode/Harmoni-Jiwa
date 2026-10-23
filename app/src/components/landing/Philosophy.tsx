import { stats } from "@/content/landing";
import { Reveal } from "./Reveal";
import styles from "./Philosophy.module.css";

export function Philosophy() {
  return (
    <section className={`wrap ${styles.section}`} id="tentang" aria-labelledby="philosophy-title">
      <Reveal>
        <p className={styles.eyebrow}>Tentang kami</p>
        <h2 id="philosophy-title">Dibuat manusia, untuk manusia.</h2>
        <p className={styles.lead}>
          Kami percaya perawatan kesehatan mental semestinya setenang dan semudah
          bercerita kepada sahabat. Tenang, tidak terburu-buru, dan sepenuhnya berfokus padamu.
        </p>
      </Reveal>
      <dl className={styles.stats}>
        {stats.map((stat, index) => (
          <div className={styles.cell} key={stat.value}>
            <Reveal delay={index * 90}>
              <dt className={styles.value}>{stat.value}</dt>
              <dd className={styles.label}>{stat.label}</dd>
            </Reveal>
          </div>
        ))}
      </dl>
    </section>
  );
}
