import { generateText, Output, type LanguageModel, type ModelMessage } from "ai";
import type { z } from "zod/v4";
import { MODELS, gatewayOptions } from "./models";

// One structured-output call that never throws. "AI failed" is an ordinary,
// typed result the caller must handle, so the normal form keeps working.

export type AiFailure = "timeout" | "unavailable" | "invalid";

export type StructuredResult<T> =
  | {
      ok: true;
      output: T;
      usage: { inputTokens: number; outputTokens: number };
      ms: number;
      /** The model that answered (the fallback when the primary failed). */
      model: string;
    }
  | { ok: false; reason: AiFailure };

type RunStructuredOptions<S extends z.ZodType> = {
  model?: LanguageModel;
  instructions: string;
  schema: S;
  /** Tag for gateway spend reports and logs, e.g. "order-draft". */
  feature: string;
  /** End-user id for gateway spend attribution (staff id, never an email). */
  user?: string;
  timeoutMs?: number;
  maxRetries?: number;
  /** Let the gateway retry on the fallback model (default true). */
  fallback?: boolean;
} & ({ prompt: string; messages?: never } | { messages: ModelMessage[]; prompt?: never });

function modelName(model: LanguageModel): string {
  return typeof model === "string" ? model : model.modelId;
}

function errorName(err: unknown): string {
  return err instanceof Error ? err.name : "";
}

/** Output/parse/schema failures mean the model answered, but not in shape. */
function isInvalidOutput(err: unknown): boolean {
  const name = errorName(err);
  return (
    name === "AI_NoObjectGeneratedError" ||
    name === "AI_NoOutputGeneratedError" ||
    name === "AI_TypeValidationError" ||
    name === "AI_JSONParseError"
  );
}

export async function runStructured<S extends z.ZodType>(
  opts: RunStructuredOptions<S>,
): Promise<StructuredResult<z.infer<S>>> {
  const model = opts.model ?? MODELS.primary;
  const signal = AbortSignal.timeout(opts.timeoutMs ?? 15_000);
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);
  const log = (ok: boolean, inTok = 0, outTok = 0, served = modelName(model), err = "") =>
    console.info(
      `ai feature=${opts.feature} model=${served} in=${inTok} out=${outTok} ms=${ms()} ok=${ok}${err ? ` err=${err}` : ""}`,
    );

  try {
    const result = await generateText({
      model,
      instructions: opts.instructions,
      ...(opts.messages ? { messages: opts.messages } : { prompt: opts.prompt as string }),
      output: Output.object({ schema: opts.schema }),
      abortSignal: signal,
      ...(opts.maxRetries !== undefined ? { maxRetries: opts.maxRetries } : {}),
      providerOptions: gatewayOptions({ feature: opts.feature, user: opts.user, fallback: opts.fallback }),
    });
    // Accessing .output throws when the model returned nothing usable.
    const output = result.output as z.infer<S>;
    const usage = {
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
    };
    // The gateway may have answered with the fallback; log who actually did.
    const served = result.response?.modelId || modelName(model);
    log(true, usage.inputTokens, usage.outputTokens, served);
    return { ok: true, output, usage, ms: ms(), model: served };
  } catch (err) {
    // Error name and HTTP status only; messages can echo request content.
    const status = (err as { statusCode?: number }).statusCode;
    log(false, 0, 0, modelName(model), `${errorName(err) || "unknown"}${status ? `:${status}` : ""}`);
    if (signal.aborted) return { ok: false, reason: "timeout" };
    if (isInvalidOutput(err)) return { ok: false, reason: "invalid" };
    return { ok: false, reason: "unavailable" };
  }
}
