import { describe, expect, it } from "vitest";
import { buildTrackingEmail, customerEmailOf } from "./order-notify";

const base = {
  orderNumber: 42,
  customerName: "Maria Santos",
  title: "Team jerseys",
  trackingUrl: "https://artnme.example/track/0123456789abcdef0123456789abcdef",
};

describe("buildTrackingEmail", () => {
  it("names the padded order number in the subject", () => {
    expect(buildTrackingEmail(base).subject).toContain("#0042");
  });

  it("greets by first name and includes the tracking link and title", () => {
    const { text, html } = buildTrackingEmail(base);
    expect(text).toContain("Hi Maria");
    expect(text).toContain(base.trackingUrl);
    expect(text).toContain("Team jerseys");
    expect(html).toContain(`href="${base.trackingUrl}"`);
  });

  it("escapes HTML in customer-supplied text", () => {
    const { html } = buildTrackingEmail({ ...base, customerName: "<b>Eve</b>", title: "Mugs & <script>" });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>Eve");
    expect(html).toContain("Mugs &amp; &lt;script&gt;");
  });
});

describe("customerEmailOf", () => {
  it("prefers the saved email", () => {
    expect(customerEmailOf({ email: "a@b.co", contactNumber: "c@d.co" })).toBe("a@b.co");
  });

  it("falls back to an email typed into the contact field", () => {
    expect(customerEmailOf({ email: null, contactNumber: " C@D.co " })).toBe("c@d.co");
  });

  it("returns null when there is no usable email", () => {
    expect(customerEmailOf({ email: null, contactNumber: "09171234567" })).toBeNull();
    expect(customerEmailOf({ email: "  ", contactNumber: null })).toBeNull();
  });
});
