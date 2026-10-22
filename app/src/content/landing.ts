/** Static copy for the landing page sections. No runtime data lives here. */

export type Stat = { value: string; label: string };
export type Service = { key: string; title: string; text: string };
export type Reason = { title: string; text: string };
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
    title: "Konsultasi awal",
    text: "Ruang tenang untuk memahami apa yang sedang kamu alami dan menentukan langkah pertama.",
  },
  {
    key: "cemas",
    title: "Kecemasan & mood",
    text: "Pendampingan terarah untuk kecemasan, depresi, burnout, dan perubahan suasana hati.",
  },
  {
    key: "remaja",
    title: "Konsultasi remaja",
    text: "Pendekatan hangat untuk remaja dan keluarga yang ingin saling memahami.",
  },
];

export const whyUs: Reason[] = [
  { title: "Pendekatan yang hangat", text: "Kami mengikuti kecepatanmu. Tidak ada paksaan, tidak ada penilaian." },
  { title: "Waktu kamu berarti", text: "Sesi tepat waktu. Jika kami terlambat lebih dari 10 menit, kami akan memberitahumu." },
  { title: "Jadwal fleksibel", text: "Buka Senin—Sabtu, termasuk sesi malam untuk yang bekerja penuh waktu." },
  { title: "Konsultasi daring", text: "Sesi video call tersedia bagi yang belum siap datang langsung." },
];

export const testimonials: Testimonial[] = [
  { quote: "Aku takut sekali untuk mulai konsultasi. Tim dr. John Doe benar-benar mengubah itu. Sekarang aku menantikan setiap sesi.", name: "John Doe 1", date: "Maret 2025" },
  { quote: "Kami membawa seluruh keluarga ke sini selama dua tahun. Cara mereka mendampingi anak remaja kami sangat sabar dan tidak menghakimi.", name: "John Doe 2", date: "Januari 2025" },
  { quote: "Ada kondisi darurat di malam hari. Mereka menyediakan slot dalam dua jam dan benar-benar membantu.", name: "John Doe 3", date: "November 2024" },
  { quote: "Booking online dalam hitungan menit dan dapat jadwal minggu itu juga. Tenang, modern, dan stafnya ramah.", name: "John Doe 4", date: "September 2024" },
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
export const bookingServices = services.map((service) => service.title);
