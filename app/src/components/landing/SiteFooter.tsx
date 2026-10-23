import { services } from "@/content/landing";
import { site } from "@/content/site";
import { Reveal } from "./Reveal";
import styles from "./SiteFooter.module.css";

const quickLinks = [
  { href: "#top", label: "Beranda" },
  { href: "#tentang", label: "Tentang" },
  { href: "#layanan", label: "Layanan" },
  { href: "#booking", label: "Booking" },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.contact}`}>
        <Reveal>
          <h2 className={styles.contactTitle}>Kami siap mendengarkan.</h2>
          <p className={styles.contactText}>
            Ada pertanyaan atau sudah siap memulai? Hubungi kami dengan cara yang paling nyaman untukmu.
          </p>
          <a className={styles.contactEmail} href={`mailto:${site.email}`}>{site.email}</a>
        </Reveal>
      </div>
      <div className={`wrap ${styles.top}`}>
        <div className={styles.brandBlock}>
          <span className="brand">
            <img className="brand-mark" src="/logo.svg" alt="" aria-hidden="true" />
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
            {services.map((service) => <a key={service.key} href="#layanan">{service.title}</a>)}
          </nav>
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Kunjungi kami</h3>
            <span>{site.city}, Indonesia</span>
            <span>Senin—Sabtu</span>
            <span>Waktu Jakarta (WIB)</span>
          </div>
        </div>
      </div>
      <div className={`wrap ${styles.bottom}`}>
        <span>© 2026 {site.name}</span>
      </div>
    </footer>
  );
}
