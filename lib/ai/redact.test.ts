import { describe, expect, it } from "vitest";
import { redactContacts } from "./redact";

describe("redactContacts", () => {
  it("masks PH mobiles in every format staff paste, and returns them normalized", () => {
    const { text, contacts } = redactContacts(
      "call me 0917 123 4567 or +63 918 765 4321, also 919-555-0101 and 639201112222. (0921)3334444",
    );
    expect(text).toBe("call me [PHONE_1] or [PHONE_2], also [PHONE_3] and [PHONE_4]. ([PHONE_5]");
    expect(contacts.phones).toEqual([
      "09171234567",
      "09187654321",
      "09195550101",
      "09201112222",
      "09213334444",
    ]);
  });

  it("gives a repeated number the same placeholder", () => {
    const { text, contacts } = redactContacts("09171234567 ... +639171234567");
    expect(text).toBe("[PHONE_1] ... [PHONE_1]");
    expect(contacts.phones).toEqual(["09171234567"]);
  });

  it("masks emails and lowercases them", () => {
    const { text, contacts } = redactContacts("send to Ana.Cruz+shop@Gmail.com pls");
    expect(text).toBe("send to [EMAIL_1] pls");
    expect(contacts.emails).toEqual(["ana.cruz+shop@gmail.com"]);
  });

  it("pulls out Facebook and Messenger links", () => {
    const { text, contacts } = redactContacts(
      "fb ko: https://www.facebook.com/ana.cruz.77 or m.me/anacruz77",
    );
    expect(text).toBe("fb ko: [LINK_1] or [LINK_2]");
    expect(contacts.messenger).toEqual(["https://www.facebook.com/ana.cruz.77", "https://m.me/anacruz77"]);
  });

  it("leaves quantities, sizes, prices and dates untouched", () => {
    const input =
      "50 pcs shirt, tarp 3x5 ft and 36 x 60 in, 350 each, total 17500, Dec 12 2026, jersey #23, 2024-2025 batch";
    const { text, contacts } = redactContacts(input);
    expect(text).toBe(input);
    expect(contacts).toEqual({ phones: [], emails: [], messenger: [] });
  });

  it("does not treat a long order number as a phone", () => {
    const input = "ref 123456789012345";
    expect(redactContacts(input).text).toBe(input);
  });
});
