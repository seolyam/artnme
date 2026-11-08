import { createAgentUIStreamResponse } from "ai";
import { getActiveUser } from "@/lib/auth";
import { aiStaffEnabled } from "@/lib/ai/flags";
import { createShopAssistant } from "@/lib/ai/assistant/agent";
import { createThrottle } from "@/lib/rate-limit";
import { getCollections, getDayActivity, getOrder, getWorkQueue } from "@/app/actions/orders";
import { getDailyMoney, getRangeReport, getReceivables } from "@/app/actions/reports";
import { searchEverything } from "@/app/actions/search";
import { getProductTypeBreakdown, getTopCustomers } from "@/app/actions/analytics";

// "Ask the shop": staff-only, read-only assistant over the report actions.
// The proxy only guards /dashboard pages, so this route checks auth itself
// and answers 401 JSON rather than redirecting.

const throttle = createThrottle({ windowMs: 10 * 60 * 1000, max: 30 });
const MAX_MESSAGES = 10;
const MAX_CHARS = 1000;

type IncomingMessage = { role?: string; parts?: { type?: string; text?: string }[] };

export async function POST(request: Request) {
  const user = await getActiveUser();
  if (!user) return Response.json({ error: "Sign in to use the assistant." }, { status: 401 });
  if (!aiStaffEnabled()) return Response.json({ error: "The assistant is turned off." }, { status: 403 });
  if (throttle.hit(user.id)) {
    return Response.json({ error: "Too many questions in a few minutes. Try again shortly." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { messages?: IncomingMessage[] } | null;
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  if (messages.length === 0 || messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Ask a question." }, { status: 400 });
  }
  const tooLong = messages.some(
    (m) => m.role === "user" && (m.parts ?? []).reduce((n, p) => n + (p.type === "text" ? (p.text?.length ?? 0) : 0), 0) > MAX_CHARS,
  );
  if (tooLong) return Response.json({ error: `Keep questions under ${MAX_CHARS} characters.` }, { status: 400 });

  const agent = createShopAssistant({
    user: user.id,
    deps: {
      getReceivables,
      getRangeReport,
      getDailyMoney,
      getWorkQueue,
      getCollections,
      getDayActivity,
      getOrder,
      searchEverything,
      getTopCustomers,
      getProductTypeBreakdown,
    },
  });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    abortSignal: request.signal,
    timeout: 60_000,
  });
}
