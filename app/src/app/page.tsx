import { AuthModal } from "@/components/auth/AuthModal";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { BookingSection } from "@/components/landing/BookingSection";
import { CtaBand } from "@/components/landing/CtaBand";
import { Doctor } from "@/components/landing/Doctor";
import { Hero } from "@/components/landing/Hero";
import { Philosophy } from "@/components/landing/Philosophy";
import { Services } from "@/components/landing/Services";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { Testimonials } from "@/components/landing/Testimonials";
import { WhyUs } from "@/components/landing/WhyUs";
import { clinicStructuredData, serializeJsonLd } from "@/lib/structured-data";

export default function Home() {
  return (
    <AuthProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(clinicStructuredData()) }}
      />
      <a className="skip-link" href="#top">Lewati ke konten utama</a>
      <SiteHeader />
      <main id="top" tabIndex={-1}>
        <Hero />
        <Philosophy />
        <Services />
        <Doctor />
        <WhyUs />
        <Testimonials />
        <BookingSection />
        <CtaBand />
      </main>
      <AuthModal />
      <SiteFooter />
    </AuthProvider>
  );
}
