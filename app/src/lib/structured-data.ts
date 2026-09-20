import { officeHours } from "@/content/landing";
import { doctor, site, siteUrl } from "@/content/site";

const dayMap: Record<string, string> = {
  Senin: "Monday",
  Selasa: "Tuesday",
  Rabu: "Wednesday",
  Kamis: "Thursday",
  Jumat: "Friday",
  Sabtu: "Saturday",
  Minggu: "Sunday",
};

function openingHours() {
  return officeHours
    .filter((entry) => entry.time.includes("–"))
    .map((entry) => {
      const [opens, closes] = entry.time.split("–").map((part) => part.trim());
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: dayMap[entry.day] ?? entry.day,
        opens,
        closes,
      };
    });
}

/** Schema.org description of the clinic, embedded as JSON-LD on the landing page. */
export function clinicStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: site.name,
    alternateName: site.legalName,
    description: site.description,
    url: siteUrl,
    email: site.email,
    medicalSpecialty: "Psychiatric",
    address: {
      "@type": "PostalAddress",
      addressLocality: site.city,
      addressRegion: site.region,
      addressCountry: site.country,
    },
    openingHoursSpecification: openingHours(),
    employee: [{ "@type": "Physician", name: doctor.name, medicalSpecialty: "Psychiatric" }],
  };
}

/**
 * Serializes JSON-LD for injection into a script tag. `<` is escaped so a copy
 * change can never break out of the script element.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
