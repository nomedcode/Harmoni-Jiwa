import { whyUs } from "@/content/landing";
import { Reveal } from "./Reveal";
import styles from "./WhyUs.module.css";

export function WhyUs() {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="whyus-title">
      <Reveal>
        <h2 id="whyus-title">Kenapa kami?</h2>
      </Reveal>
      <ul className={styles.list}>
        {whyUs.map((item, index) => (
          <li key={item.title}>
            <Reveal delay={index * 90} className={styles.item}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
