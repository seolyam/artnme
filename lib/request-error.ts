import type { Instrumentation } from "next";

type Request = Parameters<Instrumentation.onRequestError>[1];
type Context = Parameters<Instrumentation.onRequestError>[2];

const MAX_MESSAGE = 500;

export type RequestErrorReport = {
  event: "request-error";
  message: string;
  digest: string | undefined;
  method: string;
  route: string;
  routeType: Context["routeType"];
  renderSource: Context["renderSource"] | undefined;
};

/**
 * One searchable log line per server error. It names the route *pattern*
 * (`/(public)/track/[token]`), never the real path, query or headers, so
 * tracking tokens and session cookies don't end up in the logs.
 */
export function formatRequestError(err: unknown, request: Request, context: Context): RequestErrorReport {
  const raw = err instanceof Error ? err.message : String(err);
  const digest =
    typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;

  return {
    event: "request-error",
    message: raw.length > MAX_MESSAGE ? `${raw.slice(0, MAX_MESSAGE)}…` : raw,
    digest,
    method: request.method,
    route: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
  };
}
