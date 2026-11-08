import type { Instrumentation } from "next";
import { formatRequestError } from "@/lib/request-error";

/**
 * Called by Next.js for every server error (pages, route handlers, server
 * actions, proxy). Writes one JSON line to the Vercel logs; search for
 * `"event":"request-error"`. The digest matches the one shown on the error
 * page, so a staff screenshot can be traced to its log line.
 */
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  console.error(JSON.stringify(formatRequestError(err, request, context)));
};
