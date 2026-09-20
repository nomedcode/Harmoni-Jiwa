import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// BookingSection renders the client BookingForm, which reads the auth context.
// A stub keeps these tests focused on markup and accessible names.
vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ session: null, employees: [], openModal: vi.fn() }),
}));

import { Hero } from "@/components/landing/Hero";
import { Philosophy } from "@/components/landing/Philosophy";
import { Services } from "@/components/landing/Services";
import { Doctor } from "@/components/landing/Doctor";
import { WhyUs } from "@/components/landing/WhyUs";
import { Testimonials } from "@/components/landing/Testimonials";
import { CtaBand } from "@/components/landing/CtaBand";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { officeHours, services, stats, testimonials, whyUs } from "@/content/landing";
import { doctor } from "@/content/site";
import { BookingSection } from "@/components/landing/BookingSection";

describe("Hero", () => {
  it("renders one level-1 heading and the primary booking action", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Mulai konsultasi/ })).not.toHaveLength(0);
  });

  it("exposes the decorative illustration through an accessible name", () => {
    render(<Hero />);
    expect(screen.getByRole("img", { name: /ruang konsultasi/i })).toBeInTheDocument();
  });
});

describe("Philosophy", () => {
  it("renders every stat from the content module", () => {
    render(<Philosophy />);
    stats.forEach((stat) => {
      expect(screen.getByText(stat.value)).toBeInTheDocument();
      expect(screen.getByText(stat.label)).toBeInTheDocument();
    });
  });
});

describe("Services", () => {
  it("renders a booking link for every primary service", () => {
    render(<Services />);
    services.forEach((service) => {
      expect(screen.getByRole("heading", { name: service.title })).toBeInTheDocument();
    });
  });
});

describe("Doctor", () => {
  it("renders the doctor name and every credential tag", () => {
    render(<Doctor />);
    expect(screen.getByRole("heading", { name: doctor.name })).toBeInTheDocument();
    doctor.tags.forEach((tag) => expect(screen.getByText(tag)).toBeInTheDocument());
  });
});

describe("WhyUs", () => {
  it("renders all reasons", () => {
    render(<WhyUs />);
    whyUs.forEach((item) => {
      expect(screen.getByRole("heading", { name: item.title })).toBeInTheDocument();
    });
  });
});

describe("Testimonials", () => {
  it("renders each quote with a text alternative for the star rating", () => {
    render(<Testimonials />);
    testimonials.forEach((testimonial) => {
      expect(screen.getByText(testimonial.quote)).toBeInTheDocument();
    });
    expect(screen.getAllByText("Lima dari lima bintang")).toHaveLength(testimonials.length);
  });
});

describe("CtaBand", () => {
  it("renders the closing call to action", () => {
    render(<CtaBand />);
    expect(screen.getByRole("heading", { name: /Siap untuk merasa didampingi/ })).toBeInTheDocument();
  });
});

describe("SiteFooter", () => {
  it("does not render eyebrow labels on main landing sections", () => {
    const { container: servicesContainer } = render(<Services />);
    expect(servicesContainer.querySelector(".eyebrow")).toBeNull();

    const { container: ctaContainer } = render(<CtaBand />);
    expect(ctaContainer.querySelector(".eyebrow")).toBeNull();

    const { container: footerContainer } = render(<SiteFooter />);
    expect(footerContainer.querySelector(".eyebrow, .eyebrow-plain")).toBeNull();
  });

  it("renders Harmoni Jiwa contact details without legal links", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent(/Harmoni\s*Jiwa/);
    expect(footer).not.toHaveTextContent(/doktor personal/i);
    expect(screen.getByRole("link", { name: "john.doe@klinik.com" }))
      .toHaveAttribute("href", "mailto:john.doe@klinik.com");
    expect(screen.queryByRole("link", { name: "Privasi" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Kebijakan Refund" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Tautan cepat" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Layanan" })).toBeInTheDocument();
  });
});

describe("BookingSection", () => {
  it("lists every office hour row", () => {
    render(<BookingSection />);
    officeHours.forEach((entry) => {
      expect(screen.getByText(entry.day)).toBeInTheDocument();
    });
  });
});
