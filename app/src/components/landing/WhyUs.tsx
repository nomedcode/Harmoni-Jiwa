import { whyUs } from "@/content/landing";
import styles from "./WhyUs.module.css";

export function WhyUs() {
  const left = whyUs.slice(0, 2);
  const right = whyUs.slice(2);

  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="whyus-title">
      <div className={styles.grid}>
        <div className={styles.col}>
          {left.map((item) => (
            <div className={styles.item} key={item.badge}>
              <span className={styles.badge} aria-hidden="true">{item.badge}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
        <div className={styles.center}>
          <div className={styles.rings}>
            <h2 id="whyus-title">Kenapa kami?</h2>
          </div>
        </div>
        <div className={styles.col}>
          {right.map((item) => (
            <div className={styles.item} key={item.badge}>
              <span className={styles.badge} aria-hidden="true">{item.badge}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
