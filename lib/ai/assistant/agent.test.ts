import { describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { createShopAssistant, MAX_STEPS } from "./agent";
import type { AssistantDeps } from "./tools";

const usage = {
  inputTokens: { total: 50, noCache: 50, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 10, text: 10, reasoning: undefined },
};

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
    getRecentOrders: empty,
    searchEverything: vi.fn(async () => ({ orders: [], customers: [] })),
    getTopCustomers: empty,
    getProductTypeBreakdown: empty,
    ...over,
  };
}

describe("createShopAssistant", () => {
  it("calls a tool, gets its result, then answers", async () => {
    const getReceivables = vi.fn(async () => [{ orderNumber: 12, customerName: "Ana", balance: 500 }]);
    let call = 0;
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        call++;
        if (call === 1) {
          return {
            content: [{ type: "tool-call", toolCallId: "c1", toolName: "getReceivables", input: "{}" }],
            finishReason: { unified: "tool-calls", raw: undefined },
            usage,
            warnings: [],
          };
        }
        return {
          content: [{ type: "text", text: "Ana still owes ₱500 on #0012." }],
          finishReason: { unified: "stop", raw: undefined },
          usage,
          warnings: [],
        };
      },
    });

    const agent = createShopAssistant({ model, deps: deps({ getReceivables }), now: new Date("2026-11-08T10:00:00+08:00") });
    const result = await agent.generate({ prompt: "Sino pa may balance?" });

    expect(getReceivables).toHaveBeenCalledTimes(1);
    expect(result.text).toContain("₱500");
    // The tool result the model saw on its second call.
    expect(JSON.stringify(model.doGenerateCalls[1].prompt)).toContain("Ana");
    expect(result.steps.length).toBeLessThanOrEqual(MAX_STEPS);
  });

  it("stops after the step limit even if the model keeps calling tools", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () => ({
        content: [{ type: "tool-call", toolCallId: crypto.randomUUID(), toolName: "getWorkQueue", input: "{}" }],
        finishReason: { unified: "tool-calls", raw: undefined },
        usage,
        warnings: [],
      }),
    });
    const agent = createShopAssistant({ model, deps: deps(), now: new Date("2026-11-08T10:00:00+08:00") });
    const result = await agent.generate({ prompt: "loop forever" });
    expect(result.steps.length).toBe(MAX_STEPS);
  });

  it("tells the model today's shop date", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () => ({
        content: [{ type: "text", text: "ok" }],
        finishReason: { unified: "stop", raw: undefined },
        usage,
        warnings: [],
      }),
    });
    const agent = createShopAssistant({ model, deps: deps(), now: new Date("2026-11-08T23:30:00+08:00") });
    await agent.generate({ prompt: "hi" });
    expect(JSON.stringify(model.doGenerateCalls[0].prompt)).toContain("2026-11-08");
  });
});
