/** Static copy for the landing page sections. No runtime data lives here. */

export type Stat = { value: string; label: string };
export type Service = { key: string; size: "tall" | "normal"; title: string; text: string };
export type SecondaryService = { title: string; sub: string; tone: "dark" | "sage" };
export type Reason = { badge: string; title: string; text: string };
export type Testimonial = { quote: string; name: string; date: string };
export type OfficeHour = { day: string; time: string };

export const stats: Stat[] = [
  { value: "Sejak 2019", label: "Menemani warga Jakarta bercerita" },
  { value: "4.9 rating", label: "Rata-rata dari ulasan pasien" },
  { value: "Senin—Sabtu", label: "Jadwal konsultasi, termasuk malam" },
];

export const services: Service[] = [
  {
    key: "awal",
    size: "tall",
    title: "Konsultasi awal",
    text: "Ruang tenang untuk memahami apa yang sedang kamu alami dan menentukan langkah pertama.",
  },
  {
    key: "cemas",
    size: "tall",
    title: "Kecemasan & mood",
    text: "Pendampingan terarah untuk kecemasan, depresi, burnout, dan perubahan suasana hati.",
  },
  {
    key: "remaja",
    size: "normal",
    title: "Konsultasi remaja",
    text: "Pendekatan hangat untuk remaja dan keluarga yang ingin saling memahami.",
  },
  {
    key: "pasangan",
    size: "normal",
    title: "Konsultasi pasangan",
    text: "Mediasi terarah untuk komunikasi yang lebih sehat antara pasangan.",
  },
];

export const secondaryServices: SecondaryService[] = [
  { title: "Konsultasi darurat", sub: "Slot hari yang sama, hubungi kami dulu", tone: "dark" },
  { title: "Pendampingan lanjutan", sub: "Sesi rutin untuk pemulihan jangka panjang", tone: "sage" },
];

export const whyUs: Reason[] = [
  { badge: "01", title: "Pendekatan yang hangat", text: "Kami mengikuti kecepatanmu. Tidak ada paksaan, tidak ada penilaian." },
  { badge: "02", title: "Waktu kamu berarti", text: "Sesi tepat waktu. Jika kami terlambat lebih dari 10 menit, kami akan memberitahumu." },
  { badge: "03", title: "Jadwal fleksibel", text: "Buka Senin—Sabtu, termasuk sesi malam untuk yang bekerja penuh waktu." },
  { badge: "04", title: "Konsultasi daring", text: "Sesi video call tersedia bagi yang belum siap datang langsung." },
];

export const testimonials: Testimonial[] = [
  { quote: "Aku takut sekali untuk mulai konsultasi. Tim dr. John Doe benar-benar mengubah itu. Sekarang aku menantikan setiap sesi.", name: "Rani S.", date: "Maret 2025" },
  { quote: "Kami membawa seluruh keluarga ke sini selama dua tahun. Cara mereka mendampingi anak remaja kami sangat sabar dan tidak menghakimi.", name: "Budi T.", date: "Januari 2025" },
  { quote: "Ada kondisi darurat di malam hari. Mereka menyediakan slot dalam dua jam dan benar-benar membantu.", name: "Aulia P.", date: "November 2024" },
  { quote: "Booking online dalam hitungan menit dan dapat jadwal minggu itu juga. Tenang, modern, dan stafnya ramah.", name: "Fajar M.", date: "September 2024" },
];

export const officeHours: OfficeHour[] = [
  { day: "Senin", time: "09:00 – 20:00" },
  { day: "Selasa", time: "09:00 – 20:00" },
  { day: "Rabu", time: "09:00 – 20:00" },
  { day: "Kamis", time: "09:00 – 20:00" },
  { day: "Jumat", time: "09:00 – 18:00" },
  { day: "Sabtu", time: "09:00 – 14:00" },
  { day: "Minggu", time: "Tutup" },
];

/** Bookable consultation start times, in clinic local time. */
export const schedules = ["09:00", "10:30", "13:00", "14:30", "16:00"];

/** Service options offered by the booking form. */
export const bookingServices = ["Konsultasi awal", "Kecemasan & mood", "Konsultasi remaja"];
