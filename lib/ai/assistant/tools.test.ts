import { describe, expect, it, vi } from "vitest";
import { ASSISTANT_TOOL_NAMES, createAssistantTools, sanitizeForModel, type AssistantDeps } from "./tools";

function deps(over: Partial<AssistantDeps> = {}): AssistantDeps {
  const empty = vi.fn(async () => []);
  return {
    getReceivables: empty,
    getRangeReport: vi.fn(async () => ({})),
    getDailyMoney: empty,
    getWorkQueue: vi.fn(async () => ({})),
    getCollections: vi.fn(async () => ({})),
    getDayActivity: vi.fn(async () => ({})),
    getOrder: vi.fn(async () => null),
    searchEverything: vi.fn(async () => ({ orders: [], customers: [] })),
    getTopCustomers: empty,
    getProductTypeBreakdown: empty,
    ...over,
  };
}

async function run(tools: ReturnType<typeof createAssistantTools>, name: keyof typeof tools, input: unknown) {
  const t = tools[name] as unknown as { execute: (input: unknown, opts: unknown) => Promise<unknown> };
  return t.execute(input, { toolCallId: "t1", messages: [] });
}

describe("createAssistantTools", () => {
  it("exposes exactly the read-only whitelist", () => {
    expect(Object.keys(createAssistantTools(deps())).sort()).toEqual([...ASSISTANT_TOOL_NAMES].sort());
    expect(ASSISTANT_TOOL_NAMES.every((n) => /^(get|search)/.test(n))).toBe(true);
  });

  it("passes validated dates through to the report", async () => {
    const getRangeReport = vi.fn(async () => ({ total: 1 }));
    const tools = createAssistantTools(deps({ getRangeReport }));
    await run(tools, "getRangeReport", { from: "2026-11-01", to: "2026-11-08" });
    expect(getRangeReport).toHaveBeenCalledWith("2026-11-01", "2026-11-08");
  });

  it("rejects malformed dates in the input schema", () => {
    const tools = createAssistantTools(deps());
    const schema = (tools.getRangeReport as unknown as { inputSchema: { safeParse: (v: unknown) => { success: boolean } } })
      .inputSchema;
    expect(schema.safeParse({ from: "Nov 1", to: "2026-11-08" }).success).toBe(false);
    expect(schema.safeParse({ from: "2026-11-01", to: "2026-11-08" }).success).toBe(true);
  });

  it("strips contact details and caps rows in tool results", async () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({
      orderNumber: i,
      customerName: `Customer ${i}`,
      contactNumber: "09171234567",
      email: "c@example.com",
      fbMessengerLink: "https://m.me/c",
      balance: 100,
    }));
    const tools = createAssistantTools(deps({ getReceivables: vi.fn(async () => rows) }));
    const out = (await run(tools, "getReceivables", {})) as { rows: Record<string, unknown>[]; truncated: number };
    expect(out.rows).toHaveLength(20);
    expect(out.truncated).toBe(10);
    expect(JSON.stringify(out)).not.toMatch(/0917|example\.com|m\.me/);
    expect(out.rows[0]).toEqual({ orderNumber: 0, customerName: "Customer 0", balance: 100 });
  });
});

describe("sanitizeForModel", () => {
  it("removes contact-like keys at any depth and stringifies dates", () => {
    const out = sanitizeForModel({
      order: { contactNumber: "0917", customer: { name: "Ana", email: "a@b.c" }, dueDate: new Date("2026-11-13T09:00:00Z") },
      trackingToken: "secret",
    });
    expect(out).toEqual({ order: { customer: { name: "Ana" }, dueDate: "2026-11-13T09:00:00.000Z" } });
  });

  it("masks phone numbers and emails inside free text", () => {
    expect(sanitizeForModel({ note: "call 0917 123 4567 or a@b.co" })).toEqual({ note: "call [phone] or [email]" });
  });
});
