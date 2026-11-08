import { tool } from "ai";
import { z } from "zod/v4";
import { redactContacts } from "../redact";

// "Ask the shop" tools. The tool list is the permission boundary: every tool
// wraps an existing read-only report action (which keeps its own auth check),
// so a prompt-injected question can read at most what staff can already see,
// and can't change anything. Results lose contact details and are capped.

export const ASSISTANT_TOOL_NAMES = [
  "getReceivables",
  "getRangeReport",
  "getDailyMoney",
  "getWorkQueue",
  "getCollections",
  "getDayActivity",
  "getOrder",
  "getRecentOrders",
  "searchEverything",
  "getTopCustomers",
  "getProductTypeBreakdown",
] as const;

/** The report actions, injected so tests can stub them. */
export type AssistantDeps = {
  getReceivables: () => Promise<unknown>;
  getRangeReport: (from?: string, to?: string) => Promise<unknown>;
  getDailyMoney: (from?: string, to?: string) => Promise<unknown>;
  getWorkQueue: () => Promise<unknown>;
  getCollections: (day?: string) => Promise<unknown>;
  getDayActivity: (day?: string) => Promise<unknown>;
  getOrder: (orderNumber: string) => Promise<unknown>;
  getRecentOrders: (limit?: number) => Promise<unknown>;
  searchEverything: (query: string) => Promise<unknown>;
  getTopCustomers: (limit?: number) => Promise<unknown>;
  getProductTypeBreakdown: () => Promise<unknown>;
};

const MAX_ROWS = 20;
const HIDDEN_KEY = /contact|phone|email|messenger|token|url|publicid/i;
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

/** Strip contact details (by key, and inside free text), turn dates into
 *  strings, and cap nested lists. */
export function sanitizeForModel(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    return redactContacts(value)
      .text.replace(/\[PHONE_\d+\]/g, "[phone]")
      .replace(/\[EMAIL_\d+\]/g, "[email]")
      .replace(/\[LINK_\d+\]/g, "[link]");
  }
  if (Array.isArray(value)) return value.slice(0, MAX_ROWS).map(sanitizeForModel);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !HIDDEN_KEY.test(k))
        .map(([k, v]) => [k, sanitizeForModel(v)]),
    );
  }
  return value;
}

/** Top-level lists come back as { rows, truncated } so the model knows when
 *  it's seeing only part of the data. */
function forModel(value: unknown) {
  if (Array.isArray(value)) {
    return { rows: sanitizeForModel(value), truncated: Math.max(0, value.length - MAX_ROWS) };
  }
  return sanitizeForModel(value);
}

export function createAssistantTools(deps: AssistantDeps) {
  const range = z.object({ from: day, to: day });
  const optionalDay = z.object({ day: day.optional().describe("Shop date YYYY-MM-DD; today when left out.") });
  const none = z.object({});

  return {
    getReceivables: tool({
      description: "Unpaid balances: every open order where the customer still owes money, with amounts.",
      inputSchema: none,
      execute: async () => forModel(await deps.getReceivables()),
    }),
    getRangeReport: tool({
      description: "Sales, collections, order counts and breakdowns for a date range (inclusive, shop dates).",
      inputSchema: range,
      execute: async ({ from, to }) => forModel(await deps.getRangeReport(from, to)),
    }),
    getDailyMoney: tool({
      description: "Money collected per day for a date range (inclusive, shop dates).",
      inputSchema: range,
      execute: async ({ from, to }) => forModel(await deps.getDailyMoney(from, to)),
    }),
    getWorkQueue: tool({
      description: "Jobs that are due, overdue, or waiting: what needs to be worked on now.",
      inputSchema: none,
      execute: async () => forModel(await deps.getWorkQueue()),
    }),
    getCollections: tool({
      description: "Payments received on one day, with totals by payment method.",
      inputSchema: optionalDay,
      execute: async ({ day: d }) => forModel(await deps.getCollections(d)),
    }),
    getDayActivity: tool({
      description: "What happened on one day: orders created, status changes, payments.",
      inputSchema: optionalDay,
      execute: async ({ day: d }) => forModel(await deps.getDayActivity(d)),
    }),
    getOrder: tool({
      description: "One order's details by its order number (e.g. 123 for #0123).",
      inputSchema: z.object({ orderNumber: z.number().int().positive() }),
      execute: async ({ orderNumber }) => forModel(await deps.getOrder(String(orderNumber))),
    }),
    getRecentOrders: tool({
      description: "The newest orders, latest first, with customer name, items, status and amounts.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(MAX_ROWS).optional().describe("How many; default 5.") }),
      execute: async ({ limit }) => forModel(await deps.getRecentOrders(limit)),
    }),
    searchEverything: tool({
      description: "Find orders and customers by name, title or order number.",
      inputSchema: z.object({ query: z.string().min(1).max(80) }),
      execute: async ({ query }) => forModel(await deps.searchEverything(query)),
    }),
    getTopCustomers: tool({
      description: "Customers ranked by total spent.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(MAX_ROWS).optional() }),
      execute: async ({ limit }) => forModel(await deps.getTopCustomers(limit)),
    }),
    getProductTypeBreakdown: tool({
      description: "Orders and revenue by product type (shirts, tarps, mugs…).",
      inputSchema: none,
      execute: async () => forModel(await deps.getProductTypeBreakdown()),
    }),
  };
}
