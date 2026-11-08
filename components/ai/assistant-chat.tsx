"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Database, Loader2, Sparkles, Square } from "lucide-react";
import type { ShopAssistantUIMessage } from "@/lib/ai/assistant/agent";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Sino pa may balance?",
  "What's due this week?",
  "How much did we collect today?",
  "Top customers this month",
];

const TOOL_LABEL: Record<string, string> = {
  getReceivables: "receivables",
  getRangeReport: "range report",
  getDailyMoney: "daily money",
  getWorkQueue: "work queue",
  getCollections: "collections",
  getDayActivity: "day activity",
  getOrder: "order",
  getRecentOrders: "recent orders",
  searchEverything: "search",
  getTopCustomers: "top customers",
  getProductTypeBreakdown: "product breakdown",
};

/** "Ask the shop": questions about the shop's numbers, answered from the reports. */
export function AssistantChat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, stop } = useChat<ShopAssistantUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/ai/assistant" }),
  });
  const busy = status === "submitted" || status === "streaming";

  function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    sendMessage({ text: q.slice(0, 1000) });
    setInput("");
  }

  return (
    <div className="flex min-h-[60vh] flex-col gap-4">
      <div className="flex-1 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3 border border-dashed border-outline-variant/80 p-5">
            <p className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" />
              Ask about orders, balances, collections or sales.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="min-h-9 border border-outline-variant/60 px-3 text-sm hover:border-on-surface-variant"
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-on-surface-variant">
              Answers come from the same data as the Reports page. The assistant can read, never change anything.
            </p>
          </div>
        )}

        {messages.map((m) => {
          const tools = [
            ...new Set(m.parts.filter((p) => p.type.startsWith("tool-")).map((p) => p.type.slice("tool-".length))),
          ];
          const text = m.parts
            .filter((p) => p.type === "text")
            .map((p) => (p as { text: string }).text)
            .join("");
          return (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] space-y-2 px-4 py-3 text-sm",
                  m.role === "user" ? "bg-on-surface text-surface" : "border border-outline-variant/60 bg-surface-container-lowest",
                )}
              >
                {text && <p className="whitespace-pre-wrap">{text}</p>}
                {m.role === "assistant" && tools.length > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <Database className="h-3 w-3" />
                    Checked: {tools.map((t) => TOOL_LABEL[t] ?? t).join(", ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {status === "submitted" && (
          <p className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking the records…
          </p>
        )}
        {error && (
          <p className="text-sm font-medium text-accent-ink" role="alert">
            Couldn&apos;t answer that just now. Try again, or check the Reports page.
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="sticky bottom-0 flex gap-2 border-t border-outline-variant/40 bg-background pt-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          placeholder="Ask in English, Tagalog or Hiligaynon…"
          aria-label="Question"
          className="min-h-11 flex-1 border border-outline-variant/60 bg-surface-container-lowest px-3 text-sm outline-none focus:border-on-surface-variant"
        />
        {busy ? (
          <button
            type="button"
            onClick={stop}
            aria-label="Stop"
            className="flex h-11 w-11 items-center justify-center border border-outline-variant/60"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Ask"
            className="flex h-11 w-11 items-center justify-center bg-on-surface text-surface disabled:opacity-50"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  );
}
