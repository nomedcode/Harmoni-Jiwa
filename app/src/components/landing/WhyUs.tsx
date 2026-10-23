import { whyUs } from "@/content/landing";
import { Reveal } from "./Reveal";
import styles from "./WhyUs.module.css";

export function WhyUs() {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="whyus-title">
      <Reveal>
        <div className={styles.head}>
          <p className={styles.eyebrow}>Kenapa memilih kami</p>
          <h2 id="whyus-title">Ruang yang dirancang untuk pemulihanmu</h2>
          <p>Setiap bagian perjalananmu di sini dibangun di sekitar kenyamanan, privasi, dan koneksi manusiawi.</p>
        </div>
      </Reveal>
      <ul className={styles.list}>
        {whyUs.map((item, index) => (
          <li key={item.title}>
            <Reveal delay={index * 90} className={styles.item}>
              <span className={styles.number} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
