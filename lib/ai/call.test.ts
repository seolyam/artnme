import { describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { z } from "zod/v4";
import { runStructured } from "./call";

const usage = {
  inputTokens: { total: 12, noCache: 12, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 7, text: 7, reasoning: undefined },
};

function textModel(text: string) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: undefined },
      usage,
      warnings: [],
    }),
  });
}

const schema = z.object({ name: z.string(), qty: z.number().int() });
const base = { instructions: "Extract.", prompt: "50 shirts for Ana", schema, feature: "test" };

describe("runStructured", () => {
  it("returns the parsed object and token usage on success", async () => {
    const res = await runStructured({ ...base, model: textModel('{"name":"Ana","qty":50}') });
    expect(res).toMatchObject({
      ok: true,
      output: { name: "Ana", qty: 50 },
      usage: { inputTokens: 12, outputTokens: 7 },
    });
    if (res.ok) expect(res.ms).toBeGreaterThanOrEqual(0);
  });

  it("reports malformed JSON as invalid", async () => {
    const res = await runStructured({ ...base, model: textModel("{not json") });
    expect(res).toEqual({ ok: false, reason: "invalid" });
  });

  it("reports a schema mismatch as invalid", async () => {
    const res = await runStructured({ ...base, model: textModel('{"name":"Ana","qty":"fifty"}') });
    expect(res).toEqual({ ok: false, reason: "invalid" });
  });

  it("reports a thrown provider error as unavailable instead of rejecting", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error("gateway down");
      },
    });
    const res = await runStructured({ ...base, model, maxRetries: 0 });
    expect(res).toEqual({ ok: false, reason: "unavailable" });
  });

  it("reports a slow model as timeout", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: ({ abortSignal }) =>
        new Promise((_, reject) => {
          abortSignal?.addEventListener("abort", () => reject(abortSignal.reason));
        }),
    });
    const res = await runStructured({ ...base, model, timeoutMs: 20, maxRetries: 0 });
    expect(res).toEqual({ ok: false, reason: "timeout" });
  });

  it("logs metadata only, never the prompt or the output", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await runStructured({ ...base, model: textModel('{"name":"Ana","qty":50}') });
    expect(log).toHaveBeenCalledTimes(1);
    const line = String(log.mock.calls[0][0]);
    expect(line).toMatch(/^ai feature=test model=\S+ in=12 out=7 ms=\d+ ok=true$/);
    expect(line).not.toContain("Ana");
    log.mockRestore();
  });

  it("sends the gateway options with the feature tag and user", async () => {
    const model = textModel('{"name":"Ana","qty":50}');
    await runStructured({ ...base, model, user: "staff-1" });
    const opts = model.doGenerateCalls[0].providerOptions?.gateway;
    expect(opts).toMatchObject({
      tags: ["feature:test"],
      user: "staff-1",
      disallowPromptTraining: true,
    });
  });
});
