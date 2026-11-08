import { z } from "zod/v4";
import { PRODUCT_TYPES } from "@/db/schema";

// What the model may say about a chat. There are deliberately no price, total
// or id fields: prices come from the shop's price list in code, so nothing in
// the chat ("libre lang ni", "price is 0") can change them. Length and count
// limits are enforced in resolve.ts, so one long string doesn't sink a draft.

export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export const LANGUAGES = ["english", "tagalog", "hiligaynon", "mixed"] as const;

const draftItemSchema = z.object({
  productType: z.enum(PRODUCT_TYPES),
  presetRef: z
    .string()
    .nullable()
    .describe('Short ref of the matching price-list entry, e.g. "p3", or null when none clearly fits.'),
  quantity: z
    .number()
    .int()
    .nullable()
    .describe("Total pieces the customer stated. null when they didn't say; never guess."),
  sizeBreakdown: z
    .array(z.object({ size: z.string(), qty: z.number().int() }))
    .describe('Shirt/jersey sizes and counts, e.g. [{ "size": "M", "qty": 10 }]. Empty when not given.'),
  dimensions: z
    .string()
    .nullable()
    .describe(
      'Tarpaulin or print size as stated, written as "W x H unit" with unit ft, in, cm or m, e.g. "3x5 ft", "36 x 60 in", "2 x 3 m". null when not given.',
    ),
  names: z.array(z.string()).describe("Jersey names/numbers, one entry per player. Empty when not given."),
  notes: z.string().nullable().describe("Short design or print notes in the customer's words, e.g. back print, colors."),
});

// A plain union (JSON Schema anyOf), not discriminatedUnion: that emits oneOf,
// which OpenAI's strict structured output rejects with a 400.
const deadlineSchema = z
  .union([
    z.object({
      kind: z.literal("monthDay"),
      month: z.number().int().describe("1-12"),
      day: z.number().int(),
      year: z.number().int().nullable().describe("Only when the customer said the year."),
    }),
    z.object({
      kind: z.literal("weekday"),
      weekday: z.enum(WEEKDAYS),
      which: z
        .enum(["this", "next"])
        .describe('"next" only when they said next week ("next week Friday", "sunod nga semana"); otherwise "this".'),
    }),
    z.object({
      kind: z.literal("inDays"),
      days: z.number().int().describe('Days from today, e.g. "tomorrow" = 1, "in 2 weeks" = 14.'),
    }),
  ])
  .nullable()
  .describe('When they need it. null for no date or a vague "asap".');

export const orderDraftSchema = z.object({
  items: z.array(draftItemSchema).describe("One entry per distinct product. At most 10."),
  deadline: deadlineSchema,
  deadlinePhrase: z.string().nullable().describe("The customer's own words for the deadline, if any."),
  customerName: z.string().nullable().describe("The customer's name if they gave it."),
  language: z.enum(LANGUAGES).describe("Main language of the customer's messages."),
  questions: z
    .array(z.string())
    .describe("Up to 4 short questions (in English, for staff) about information needed to quote or make the order."),
  replyDraft: z
    .string()
    .describe(
      "A short, friendly reply to the customer in their own language that confirms what was understood and asks the missing questions. No prices. Under 600 characters.",
    ),
  summary: z.string().describe("One-line English summary for staff, under 160 characters."),
});

export type OrderDraftOutput = z.infer<typeof orderDraftSchema>;
export type DraftItem = OrderDraftOutput["items"][number];
export type DraftDeadline = NonNullable<OrderDraftOutput["deadline"]>;
