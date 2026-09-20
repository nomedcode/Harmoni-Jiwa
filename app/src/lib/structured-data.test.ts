import { describe, expect, it } from "vitest";
import { clinicStructuredData, serializeJsonLd } from "@/lib/structured-data";
import { site } from "@/content/site";

describe("clinicStructuredData", () => {
  const data = clinicStructuredData();

  it("declares a MedicalClinic with the clinic identity", () => {
    expect(data["@type"]).toBe("MedicalClinic");
    expect(data.name).toBe(site.name);
    expect(data.address.addressLocality).toBe(site.city);
  });

  it("skips closed days in the opening hours", () => {
    expect(data.openingHoursSpecification).toHaveLength(6);
    expect(data.openingHoursSpecification.map((entry) => entry.dayOfWeek)).not.toContain("Sunday");
  });

  it("maps Indonesian day names to schema.org values", () => {
    expect(data.openingHoursSpecification[0]).toMatchObject({
      dayOfWeek: "Monday",
      opens: "09:00",
      closes: "20:00",
    });
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so copy can never close the script tag", () => {
    expect(serializeJsonLd({ name: "<script>alert(1)</script>" }))
      .toBe('{"name":"\\u003cscript>alert(1)\\u003c/script>"}');
  });
});
