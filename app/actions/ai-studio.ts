"use server";

import { headers } from "next/headers";
import { z } from "zod/v4";
import { aiPublicEnabled } from "@/lib/ai/flags";
import { draftStudioBrief } from "@/lib/ai/studio";
import { createThrottle } from "@/lib/rate-limit";

const throttle = createThrottle({ windowMs: 10 * 60 * 1000, max: 10 });
const textSchema = z.string().trim().min(3).max(300);

export type StudioSuggestion =
  | { ok: true; templateId: string; values: Record<string, string>; shirtColor: string; reason: string }
  | { ok: false; message: string };

/** Public: "Describe your event" → a template filled with the customer's words.
 *  Nothing is placed on the shirt until the customer presses the button. */
export async function suggestStudioDesign(text: string): Promise<StudioSuggestion> {
  if (!aiPublicEnabled()) return { ok: false, message: "This isn't available right now. Pick a design below." };
  const parsed = textSchema.safeParse(text);
  if (!parsed.success) return { ok: false, message: "Describe your event in a few words (up to 300 letters)." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttle.hit(ip)) return { ok: false, message: "That's a lot of tries! Pick a design below for now." };

  const res = await draftStudioBrief(parsed.data);
  if (!res.ok) return { ok: false, message: "Couldn't come up with a design just now. Pick one below." };
  return res;
}
