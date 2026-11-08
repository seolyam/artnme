import type { PricePresetView } from "@/app/actions/prices";
import type { CreateOrderDefaults } from "@/components/forms/create-order-form";
import type { ProductType } from "@/db/schema";
import { parseSize, priceBySize } from "@/lib/pricing";
import { DEFAULT_DUE_TIME, addShopDays, shopToday } from "@/lib/time";
import { presetRefs } from "./prompt";
import { WEEKDAYS, type DraftDeadline, type DraftItem, type OrderDraftOutput } from "./schema";

// The model extracts; this file decides. Prices, dates, flags and the
// missing-info questions are all worked out here, deterministically.

export const MAX_ITEMS = 10;
export const MAX_QUESTIONS = 4;
export const MAX_REPLY = 600;
export const MAX_SUMMARY = 160;
const LARGE_RUN = 10_000;
const RUSH_DAYS = 3;

export type FlagCode = "needs_price" | "needs_quantity" | "size_sum_mismatch" | "large_run" | "rush" | "past_deadline";
export type Flag = { code: FlagCode; message: string; item?: number };

export type ItemPriceSource =
  | { source: "preset"; presetId: string; label: string; unit: PricePresetView["unit"]; price: number }
  | { source: "none" };

export type ResolvedDraft = {
  defaults: CreateOrderDefaults;
  flags: Flag[];
  /** Where each item's price came from, index-aligned with defaults.items. */
  priced: ItemPriceSource[];
  questions: string[];
  replyDraft: string;
  summary: string;
  customerName: string | null;
  language: OrderDraftOutput["language"];
};

type Question = { text: string; covers: (q: string) => boolean };

const DESIGN_WORDS =
  /\b(design|disenyo|logo|file|artwork|art ?work|layout|lay-?out|picture|pic|photo|litrato|image|attach\w*|png|jpe?g|pdf|psd|ai file|sample|peg|reference|drawing|mock-?up)\b/i;

// ─── Dates ──────────────────────────────────────────────────────────────────

function isoDay(y: number, m: number, d: number): string | null {
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}

/** Whole days from one shop day (YYYY-MM-DD) to another. */
function dayDiff(from: string, to: string) {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

function weekdayIndex(day: string) {
  // 0 = Monday … 6 = Sunday, matching WEEKDAYS.
  return (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
}

export function resolveDeadline(deadline: DraftDeadline | null, today: string): string | null {
  if (!deadline) return null;
  switch (deadline.kind) {
    case "monthDay": {
      const thisYear = Number(today.slice(0, 4));
      if (deadline.year != null) return isoDay(deadline.year, deadline.month, deadline.day);
      const day = isoDay(thisYear, deadline.month, deadline.day);
      if (day && day >= today) return day;
      return isoDay(thisYear + 1, deadline.month, deadline.day);
    }
    case "weekday": {
      const ahead = (WEEKDAYS.indexOf(deadline.weekday) - weekdayIndex(today) + 7) % 7;
      return addShopDays(today, ahead + (deadline.which === "next" ? 7 : 0));
    }
    case "inDays":
      return addShopDays(today, deadline.days);
  }
}

// ─── Items ──────────────────────────────────────────────────────────────────

function isJersey(type: ProductType) {
  return type === "Jersey Upper" || type === "Jersey Set";
}

function resolveItem(item: DraftItem, index: number, refs: Map<string, PricePresetView>, flags: Flag[], questions: Question[]) {
  const sizes = item.sizeBreakdown.filter((s) => s.size.trim() && s.qty > 0);
  const sizeSum = sizes.reduce((n, s) => n + s.qty, 0);
  const stated = item.quantity != null && item.quantity >= 1 ? item.quantity : null;

  let quantity = stated ?? (sizeSum > 0 ? sizeSum : null);
  if (quantity == null) {
    quantity = 1;
    flags.push({ code: "needs_quantity", item: index, message: `Item ${index + 1}: quantity not stated` });
    questions.push({
      text: `How many pieces of ${item.productType}?`,
      covers: (q) => /how many|quantity|\bpila\b/i.test(q),
    });
  }
  if (stated != null && sizeSum > 0 && sizeSum !== stated) {
    flags.push({
      code: "size_sum_mismatch",
      item: index,
      message: `Item ${index + 1}: sizes add up to ${sizeSum}, but ${stated} were asked for`,
    });
  }
  if (quantity > LARGE_RUN) {
    flags.push({ code: "large_run", item: index, message: `Item ${index + 1}: ${quantity} pieces is a very large run` });
  }

  const dimensions = item.dimensions?.trim() ?? "";
  const size = parseSize(dimensions);
  const ref = item.presetRef ? refs.get(item.presetRef) : undefined;
  const preset = ref && ref.productType === item.productType ? ref : undefined;

  let unitPrice = 0;
  let priced: ItemPriceSource = { source: "none" };
  if (preset) {
    const price = Number(preset.price);
    priced = { source: "preset", presetId: preset.id, label: preset.label, unit: preset.unit, price };
    if (preset.unit === "piece") unitPrice = price;
    else if (size) unitPrice = priceBySize(size, price);
  }
  if (unitPrice === 0) {
    flags.push({ code: "needs_price", item: index, message: `Item ${index + 1}: no price yet` });
  }

  if (item.productType === "Tarpaulin" && !size) {
    questions.push({
      text: "What size is the tarpaulin (e.g. 3x5 ft)?",
      covers: (q) => /tarp/i.test(q) && /size|dimension|how big|sukat|kadakuon/i.test(q),
    });
  }
  if (isJersey(item.productType) && sizes.length === 0) {
    questions.push({
      text: "What jersey sizes, and how many of each?",
      covers: (q) => /size/i.test(q) && /jersey|each/i.test(q),
    });
  }

  const notes = item.notes?.trim() ?? "";
  const lines = [
    preset && !notes.toLowerCase().includes(preset.label.toLowerCase()) ? preset.label : "",
    notes,
    sizes.length ? `Sizes: ${sizes.map((s) => `${s.size.trim()}×${s.qty}`).join(", ")}` : "",
    item.names.length ? ["Names:", ...item.names.map((n) => `- ${n.trim()}`)].join("\n") : "",
  ].filter(Boolean);

  return {
    formItem: {
      productType: item.productType,
      description: lines.join("\n"),
      quantity,
      dimensions,
      unitPrice,
    },
    priced,
  };
}

// ─── Draft ──────────────────────────────────────────────────────────────────

function mergeQuestions(fromCode: Question[], fromModel: string[]) {
  const out: string[] = [];
  const add = (q: string) => {
    if (out.length < MAX_QUESTIONS && !out.some((o) => o.toLowerCase() === q.toLowerCase())) out.push(q);
  };
  for (const q of fromCode) add(q.text);
  for (const raw of fromModel) {
    const q = raw.trim();
    if (q && !fromCode.some((c) => c.covers(q))) add(q);
  }
  return out;
}

function clip(text: string, max: number) {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

export function resolveDraft(
  output: OrderDraftOutput,
  { presets, now, text }: { presets: PricePresetView[]; now: Date; text: string },
): ResolvedDraft {
  const today = shopToday(now);
  const refs = new Map(presetRefs(presets).map(({ ref, preset }) => [ref, preset]));
  const flags: Flag[] = [];
  const questions: Question[] = [];

  const resolved = output.items.slice(0, MAX_ITEMS).map((item, i) => resolveItem(item, i, refs, flags, questions));

  // Questions about one item can repeat across items (two tarps); keep one.
  const uniqueQuestions = questions.filter((q, i) => questions.findIndex((o) => o.text === q.text) === i);
  if (resolved.length > 0 && !DESIGN_WORDS.test(text)) {
    uniqueQuestions.push({
      text: "Do they have a design file, or should our designer make one?",
      covers: (q) => /design|logo|artwork|layout|file/i.test(q),
    });
  }

  const day = resolveDeadline(output.deadline, today);
  if (day) {
    const diff = dayDiff(today, day);
    if (diff < 0) flags.push({ code: "past_deadline", message: `The date ${day} has already passed` });
    else if (diff <= RUSH_DAYS) flags.push({ code: "rush", message: diff === 0 ? "Needed today" : `Needed in ${diff} day${diff === 1 ? "" : "s"}` });
  }

  return {
    defaults: {
      ...(resolved.length ? { items: resolved.map((r) => r.formItem) } : {}),
      ...(day ? { dueDate: `${day}T${DEFAULT_DUE_TIME}` } : {}),
    },
    flags,
    priced: resolved.map((r) => r.priced),
    questions: mergeQuestions(uniqueQuestions, output.questions),
    replyDraft: clip(output.replyDraft, MAX_REPLY),
    summary: clip(output.summary, MAX_SUMMARY),
    customerName: output.customerName?.trim() || null,
    language: output.language,
  };
}
