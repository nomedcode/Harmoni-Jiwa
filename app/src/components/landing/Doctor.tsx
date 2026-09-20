import { doctor } from "@/content/site";
import styles from "./Doctor.module.css";

export function Doctor() {
  return (
    <section className={`wrap ${styles.section}`} aria-labelledby="doctor-title">
      <div className={styles.row}>
        <div className={styles.info}>
          <h2 id="doctor-title">{doctor.name}</h2>
          <ul className={styles.tags}>
            {doctor.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        </div>
        <div className={styles.photo} aria-hidden="true"><span>{doctor.initials}</span></div>
        <div className={styles.copy}>
          <p>{doctor.bio}</p>
          <a className={styles.moreLink} href="#booking">
            Kenal lebih jauh <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
