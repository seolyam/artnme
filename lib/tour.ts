import { SITE } from "@/lib/site";

/**
 * The first-visit "how to order" tour. Pure data and geometry only, so it can
 * be unit tested without a browser; the overlay lives in components/tour.
 */

export type TourStep = {
  /** Page the step lives on; the tour navigates there before showing it. */
  path: string;
  /** `data-tour` names to point at, first visible one wins (desktop vs phone layouts). */
  targets: string[];
  title: string;
  body: string;
  /** Let the customer press or type into the highlighted element. */
  interactive?: boolean;
  /** Scroll to the very top first, for targets in the hide-on-scroll navbar. */
  scrollTop?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    path: "/",
    targets: ["nav-links", "nav-menu"],
    title: "This is the menu",
    body: "Use it to see our past work (Portfolio), try your design on a shirt (3D Studio), or find our address and phone number (Contact).",
    scrollTop: true,
  },
  {
    path: "/",
    targets: ["nav-quote", "hero-quote"],
    title: "Ready to order? Start here",
    body: "Press this red button whenever you want to order. Press it now, or press Next, and we'll go there together.",
    interactive: true,
    scrollTop: true,
  },
  {
    path: "/quote",
    targets: ["quote-contact"],
    title: "Tell us who you are",
    body: "Type your name, phone number and email. This is how we send you the price. We never share it.",
    interactive: true,
  },
  {
    path: "/quote",
    targets: ["quote-product"],
    title: "What should we print?",
    body: "Press one box: shirt, jersey, mug, tarpaulin, and so on. The one you pick turns dark.",
    interactive: true,
  },
  {
    path: "/quote",
    targets: ["quote-qty"],
    title: "How many, and by when?",
    body: "Press − or + to change how many you need. If you need it by a certain day, pick the date. The date is optional.",
    interactive: true,
  },
  {
    path: "/quote",
    targets: ["quote-details"],
    title: "Write the details",
    body: "Sizes, colors, names and numbers, anything we should know. Write it the way you would say it.",
    interactive: true,
  },
  {
    path: "/quote",
    targets: ["quote-file"],
    title: "Have a picture? Add it here",
    body: "Press this box to attach a photo, logo or design from your phone or computer. This is optional, we can also design it for you.",
    interactive: true,
  },
  {
    path: "/quote",
    targets: ["quote-submit"],
    title: "Send it to us",
    body: `When you're done, press Submit inquiry. We'll contact you with the price, usually within 1–2 hours during shop hours (${SITE.hoursLabel}). You don't pay anything yet.`,
    interactive: true,
  },
  {
    path: "/quote",
    targets: ["help-button"],
    title: "Need help again?",
    body: "Press Help any time to see this guide again.",
  },
];

export type Rect = { top: number; left: number; width: number; height: number };
export type Size = { width: number; height: number };
export type CardPosition = { top: number; left: number; side: "below" | "above" | "bottom" | "center" };

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), Math.max(min, max));

/**
 * Where the instruction card goes: under the highlighted element if it fits,
 * otherwise over it, otherwise pinned to the bottom of the screen (a tall
 * target on a phone). Always kept `margin` px inside the screen.
 */
export function placeCard(target: Rect | null, card: Size, viewport: Size, gap = 16, margin = 16): CardPosition {
  if (!target) {
    return {
      top: Math.max(margin, (viewport.height - card.height) / 2),
      left: Math.max(margin, (viewport.width - card.width) / 2),
      side: "center",
    };
  }

  const left = clamp(target.left + target.width / 2 - card.width / 2, margin, viewport.width - card.width - margin);
  const bottom = target.top + target.height;

  if (viewport.height - bottom - gap - margin >= card.height) return { top: bottom + gap, left, side: "below" };
  if (target.top - gap - margin >= card.height) return { top: target.top - gap - card.height, left, side: "above" };
  return { top: Math.max(margin, viewport.height - card.height - margin), left, side: "bottom" };
}

/** The bright cut-out around the target: padded a little and clipped to the screen. */
export function holeFor(target: Rect, viewport: Size, pad = 8): Rect {
  const top = Math.max(0, target.top - pad);
  const left = Math.max(0, target.left - pad);
  const bottom = Math.min(viewport.height, target.top + target.height + pad);
  const right = Math.min(viewport.width, target.left + target.width + pad);
  return { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

/**
 * After the page changes while the tour is open: keep the step if we're on its
 * page, advance if the customer pressed the highlighted link themselves, or
 * end the tour (null) if they went somewhere else.
 */
export function nextAfterNavigation(step: number, pathname: string): number | null {
  if (TOUR_STEPS[step]?.path === pathname) return step;
  if (TOUR_STEPS[step + 1]?.path === pathname) return step + 1;
  return null;
}
