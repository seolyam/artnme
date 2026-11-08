import { describe, expect, it } from "vitest";
import { formatRequestError } from "./request-error";

const request = {
  path: "/track/9f2c1e7a-secret-token?ref=sms",
  method: "GET",
  headers: { cookie: "sb-access-token=abc" },
};
const context = {
  routerKind: "App Router" as const,
  routePath: "/(public)/track/[token]",
  routeType: "render" as const,
  renderSource: "server-rendering" as const,
  revalidateReason: undefined,
  renderType: "dynamic" as const,
};

describe("formatRequestError", () => {
  it("reports the message, digest and route context", () => {
    const err = Object.assign(new Error("relation does not exist"), { digest: "123456" });
    expect(formatRequestError(err, request, context)).toEqual({
      event: "request-error",
      message: "relation does not exist",
      digest: "123456",
      method: "GET",
      route: "/(public)/track/[token]",
      routeType: "render",
      renderSource: "server-rendering",
    });
  });

  it("uses the route pattern, never the real path, query or headers", () => {
    const line = JSON.stringify(formatRequestError(new Error("x"), request, context));
    expect(line).not.toContain("secret-token");
    expect(line).not.toContain("ref=sms");
    expect(line).not.toContain("sb-access-token");
  });

  it("handles thrown values that are not Errors", () => {
    const out = formatRequestError("boom", request, context);
    expect(out.message).toBe("boom");
    expect(out.digest).toBeUndefined();
  });

  it("caps very long messages", () => {
    const out = formatRequestError(new Error("a".repeat(5000)), request, context);
    expect(out.message.length).toBeLessThanOrEqual(501);
    expect(out.message.endsWith("…")).toBe(true);
  });
});
