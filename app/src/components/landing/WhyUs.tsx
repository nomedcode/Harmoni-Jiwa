import { whyUs } from "@/content/landing";
import styles from "./WhyUs.module.css";

export function WhyUs() {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="whyus-title">
      <h2 id="whyus-title">Kenapa kami?</h2>
      <ul className={styles.list}>
        {whyUs.map((item) => (
          <li className={styles.item} key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
