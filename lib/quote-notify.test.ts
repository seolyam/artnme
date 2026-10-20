import { describe, expect, it } from "vitest";
import { QUOTE_NOTIFY_TO, buildQuoteEmail } from "./quote-notify";

const base = {
  orderNumber: 1019,
  name: "Test Customer",
  contact: "09191919191",
  email: "customer@example.com",
  productLabel: "T-Shirt",
  quantity: 2,
  details: "Front print, black ink",
  neededBy: null,
  source: undefined,
  attachmentUrl: null,
};

describe("QUOTE_NOTIFY_TO", () => {
  it("sends quote alerts to the studio inbox", () => {
    expect(QUOTE_NOTIFY_TO).toBe("artinme03@gmail.com");
  });
});

describe("buildQuoteEmail", () => {
  it("puts the order number and product in the subject", () => {
    const { subject } = buildQuoteEmail(base);
    expect(subject).toContain("#1019");
    expect(subject).toContain("2× T-Shirt");
  });

  it("includes the customer, contact and details in the body", () => {
    const { text } = buildQuoteEmail(base);
    expect(text).toContain("Test Customer");
    expect(text).toContain("09191919191");
    expect(text).toContain("Front print, black ink");
  });

  it("links the attachment when one was uploaded", () => {
    const { text } = buildQuoteEmail({
      ...base,
      attachmentUrl: "https://res.cloudinary.com/demo/file.png",
    });
    expect(text).toContain("https://res.cloudinary.com/demo/file.png");
  });

  it("notes the 3D Studio source when the quote came from the studio", () => {
    const { text } = buildQuoteEmail({ ...base, source: "studio" });
    expect(text).toContain("3D Studio");
  });
});
