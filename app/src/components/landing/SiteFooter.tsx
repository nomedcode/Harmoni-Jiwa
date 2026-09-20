import { site } from "@/content/site";
import styles from "./SiteFooter.module.css";

const quickLinks = [
  { href: "#top", label: "Beranda" },
  { href: "#tentang", label: "Tentang" },
  { href: "#layanan", label: "Layanan" },
  { href: "#booking", label: "Booking" },
];

const serviceLinks = [
  "Konsultasi awal",
  "Kecemasan & mood",
  "Konsultasi remaja",
  "Konsultasi darurat",
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.top}`}>
        <div className={styles.brandBlock}>
          <span className="brand">
            <span className="brand-mark" aria-hidden="true">{site.shortBrand.mark}</span>
            <span>{site.shortBrand.first}<br /><em>{site.shortBrand.second}</em></span>
          </span>
          <p>Ruang aman untuk bercerita, untuk seluruh keluarga.</p>
        </div>
        <div className={styles.cols}>
          <nav className={styles.col} aria-label="Tautan cepat">
            {quickLinks.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}
          </nav>
          <nav className={styles.col} aria-label="Layanan">
            <h3 className={styles.colTitle}>Layanan</h3>
            {serviceLinks.map((label) => <a key={label} href="#layanan">{label}</a>)}
          </nav>
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Kunjungi kami</h3>
            <span>{site.city}, Indonesia</span>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <span>Senin—Sabtu</span>
          </div>
        </div>
      </div>
      <div className={`wrap ${styles.bottom}`}>
        <span>© 2026 {site.name}. Seluruh hak cipta dilindungi.</span>
      </div>
    </footer>
  );
}
