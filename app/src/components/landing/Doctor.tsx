import Link from "next/link";
import { doctor } from "@/content/site";
import { Reveal } from "./Reveal";
import styles from "./Doctor.module.css";

export function Doctor() {
  return (
    <section className={`wrap ${styles.section}`} id="dokter" aria-labelledby="doctor-title">
      <Reveal>
        <div className={styles.row}>
          <div className={styles.info}>
            <p className={styles.eyebrow}>Psikiater kami</p>
            <h2 id="doctor-title">{doctor.name}</h2>
            <ul className={styles.tags}>
              {doctor.tags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
          </div>
          <div className={styles.photo} aria-hidden="true"><span>{doctor.initials}</span></div>
          <div className={styles.copy}>
            <p>{doctor.bio}</p>
            <Link className={styles.moreLink} href="/booking">
              Buat janji dengan {doctor.firstName}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
