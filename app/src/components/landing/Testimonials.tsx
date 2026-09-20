import { testimonials } from "@/content/landing";
import styles from "./Testimonials.module.css";

export function Testimonials() {
  return (
    <section className={`wrap ${styles.section}`} id="ulasan" aria-labelledby="testimonials-title">
      <h2 id="testimonials-title">Kata mereka yang sudah bercerita</h2>
      <ul className={styles.track} tabIndex={0} aria-label="Daftar ulasan pasien">
        {testimonials.map((testimonial) => (
          <li className={styles.card} key={testimonial.name}>
            <p className={styles.stars}>
              <span aria-hidden="true">★★★★★</span>
              <span className="visually-hidden">Lima dari lima bintang</span>
            </p>
            <blockquote className={styles.quote}>{testimonial.quote}</blockquote>
            <div className={styles.divider} aria-hidden="true" />
            <div className={styles.author}>
              <span className={styles.avatar} aria-hidden="true" />
              <div>
                <strong>{testimonial.name}</strong>
                <span>{testimonial.date}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
