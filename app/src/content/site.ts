/**
 * Clinic-wide constants shared by the landing page, the staff dashboard and the
 * metadata/JSON-LD helpers. Keeping the values here avoids drift between the UI
 * copy and the structured data exposed to search engines.
 */

export const site = {
  name: "Harmoni Jiwa",
  legalName: "Klinik Psikiatri dr. John Doe",
  shortBrand: { first: "Harmoni", second: "Jiwa", mark: "HJ" },
  tagline: "Ruang aman untuk bercerita",
  description:
    "Klinik psikiatri personal untuk konsultasi yang aman, profesional, dan manusiawi.",
  locale: "id-ID",
  language: "id",
  email: "john.doe@klinik.com",
  city: "Jakarta Selatan",
  region: "DKI Jakarta",
  country: "ID",
} as const;

/**
 * Canonical origin used by metadata, sitemap and robots. Vercel exposes
 * NEXT_PUBLIC_SITE_URL in production; localhost keeps development output valid.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"
).replace(/\/+$/, "");

export const navLinks = [
  { href: "#tentang", label: "Tentang" },
  { href: "#layanan", label: "Layanan" },
  { href: "#ulasan", label: "Ulasan" },
  { href: "#booking", label: "Booking" },
] as const;

export const doctor = {
  name: "dr. John Doe, Sp.KJ",
  initials: "JD",
  firstName: "dr. John",
  lastName: "Doe",
  tags: ["Sp.KJ", "Psikiater Klinis", "10 Tahun Pengalaman", "Pendekatan Berbasis Bukti"],
  bio: "dr. John Doe mendampingi pasien dengan pendekatan yang hangat, terstruktur, dan berbasis bukti. Ia percaya bahwa memahami diri sendiri adalah langkah penting menuju pemulihan, sehingga setiap sesi dirancang sebagai ruang aman untuk bercerita tanpa penilaian.",
} as const;
