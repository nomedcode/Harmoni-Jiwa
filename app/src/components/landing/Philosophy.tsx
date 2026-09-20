import { stats } from "@/content/landing";
import styles from "./Philosophy.module.css";

export function Philosophy() {
  return (
    <section className={`wrap ${styles.section}`} id="tentang" aria-labelledby="philosophy-title">
      <div className={styles.row}>
        <h2 id="philosophy-title">
          “Tidak harus selalu kuat.<br /><i>Kamu hanya perlu mulai bercerita.</i>”
        </h2>
        <p>
          Kami membangun praktik ini dengan satu keyakinan: perawatan yang terasa manusiawi. Tenang,
          tidak terburu-buru, dan sepenuhnya berfokus padamu. Tanpa buru-buru, tanpa istilah rumit,
          tanpa kejutan.
        </p>
      </div>
      <dl className={styles.stats}>
        {stats.map((stat) => (
          <div className={styles.cell} key={stat.value}>
            <dt className={styles.value}>{stat.value}</dt>
            <dd className={styles.label}>{stat.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
