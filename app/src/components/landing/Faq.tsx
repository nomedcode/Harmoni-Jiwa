import { faqs } from "@/content/landing";
import { Reveal } from "./Reveal";
import styles from "./Faq.module.css";

export function Faq() {
  return (
    <section className={`wrap ${styles.section}`} id="faq" aria-labelledby="faq-title">
      <Reveal>
        <div className={styles.head}>
          <h2 id="faq-title">Pertanyaan yang sering ditanyakan</h2>
          <p>Belum menemukan jawabannya? Hubungi kami lewat email di bagian bawah halaman.</p>
        </div>
      </Reveal>
      <ul className={styles.list}>
        {faqs.map((faq, index) => (
          <li key={faq.question}>
            <Reveal delay={index * 70}>
              <details className={styles.item} name="faq">
                <summary className={styles.question}>{faq.question}</summary>
                <p className={styles.answer}>{faq.answer}</p>
              </details>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
