import { officeHours } from "@/content/landing";
import { BookingForm } from "./BookingForm";
import styles from "./BookingSection.module.css";

export function BookingSection() {
  return (
    <section className={`wrap ${styles.section}`} id="booking" aria-labelledby="booking-title">
      <h2 id="booking-title">Jadwalkan sesi kamu</h2>
      <div className={styles.grid}>
        <div className={styles.hoursCard}>
          <div className={styles.hoursHead}>
            <h3>Jam operasional</h3>
            <span className={styles.openBadge}>Buka hari ini</span>
          </div>
          <dl>
            {officeHours.map((item) => (
              <div className={styles.hoursRow} key={item.day}>
                <dt>{item.day}</dt>
                <dd className={styles.hoursTime}>{item.time}</dd>
              </div>
            ))}
          </dl>
        </div>
        <BookingForm />
      </div>
    </section>
  );
}
