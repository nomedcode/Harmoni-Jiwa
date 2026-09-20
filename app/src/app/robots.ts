import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // The staff dashboard holds patient data and must stay out of search results.
      { userAgent: "*", allow: "/", disallow: ["/karyawan/"] },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
