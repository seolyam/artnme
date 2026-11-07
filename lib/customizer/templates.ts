import type { Placement } from "@/components/customizer/CustomizerProvider";

/**
 * Ready-made shirt designs for the 3D Studio, modelled on the kinds of jobs in
 * the portfolio (team jerseys, batch reunions, officer shirts, fun runs,
 * business uniforms, family reunions) but drawn from scratch here.
 *
 * Each template is a few "pieces" (one per printed area). A piece paints its
 * artwork onto a canvas from the customer's own words, and becomes a normal
 * image layer in the studio, so it can still be moved, resized or removed.
 * Nothing here touches the DOM until renderPiece() is called in the browser.
 */

export type TemplateField = {
  key: string;
  label: string;
  /** Shown filled in, so every template preview looks finished. */
  sample: string;
  maxLength: number;
  hint?: string;
  numeric?: boolean;
};

type Values = Record<string, string>;
type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, v: Values, font: string) => void;

export type TemplatePiece = {
  id: string;
  label: string;
  placement: Placement;
  /** Centre of the print on the shirt model (x: left/right, y: height), in model units. */
  x?: number;
  y: number;
  width: number;
  height: number;
  draw: Draw;
};

export type ShirtTemplate = {
  id: string;
  name: string;
  description: string;
  shirtColor: string;
  shirtLabel: string;
  fields: TemplateField[];
  pieces: TemplatePiece[];
};

// ---------------------------------------------------------------------------
// Placement on the 3D shirt
// ---------------------------------------------------------------------------

/** Same offsets the studio uses for new layers (CustomizerProvider DEFAULT_*_POSITION z). */
const SURFACE_Z = 0.14;

export function piecePose(piece: Pick<TemplatePiece, "placement" | "x" | "y" | "width" | "height">) {
  const back = piece.placement === "back";
  return {
    position: [piece.x ?? 0, piece.y, back ? -SURFACE_Z : SURFACE_Z] as [number, number, number],
    rotation: [0, back ? Math.PI : 0, 0] as [number, number, number],
    scale: [piece.width, piece.height, piece.width] as [number, number, number],
  };
}

export function templateDefaults(template: ShirtTemplate): Values {
  return Object.fromEntries(template.fields.map((f) => [f.key, f.sample]));
}

/** Stored on each layer a template creates, so its words can be changed later. */
export type TemplateLink = { id: string; piece: string; values: Values };

/** The template the current design came from (if any) and the words it was made with. */
export function templateOnShirt(layers: { template?: TemplateLink }[]) {
  const link = layers.find((l) => l.template)?.template;
  const template = link && SHIRT_TEMPLATES.find((t) => t.id === link.id);
  if (!link || !template) return null;
  return { template, values: { ...templateDefaults(template), ...link.values } };
}

const SMALL_WORDS = new Set(["the", "of", "and", "ng", "sa", "for", "a", "an", "&"]);

/** "Youth Council of Silay" → "YCS", for the round chest badge. */
export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => w && !SMALL_WORDS.has(w.toLowerCase()))
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

type TextStyle = {
  size: number;
  maxWidth: number;
  color: string;
  weight?: number;
  align?: CanvasTextAlign;
  /** Letter spacing as a fraction of the font size. */
  spacing?: number;
  /** Lean like italics (0.2 ≈ 11°). */
  skew?: number;
  /** Stretch tall, like jersey numbers. */
  scaleY?: number;
  /** Outline drawn under the fill; width is the visible outline thickness. */
  outline?: { color: string; width: number };
  shadow?: { dx: number; dy: number; color: string };
};

/** Draws one line of text, shrinking it to fit maxWidth. Returns the drawn width. */
function text(ctx: CanvasRenderingContext2D, family: string, value: string, x: number, y: number, s: TextStyle) {
  if (!value.trim()) return 0;
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  let size = s.size;
  const apply = () => {
    ctx.font = `${s.weight ?? 700} ${Math.round(size)}px ${family}`;
    if ("letterSpacing" in c) c.letterSpacing = `${Math.round((s.spacing ?? 0) * size)}px`;
  };
  ctx.save();
  apply();
  let width = ctx.measureText(value).width;
  if (width > s.maxWidth) {
    size = Math.floor((size * s.maxWidth) / width);
    apply();
    width = ctx.measureText(value).width;
  }
  ctx.textAlign = s.align ?? "center";
  ctx.textBaseline = "middle";
  // Letter spacing trails the last letter; shift back so centred text stays centred.
  const trail = "letterSpacing" in c && (s.align ?? "center") === "center" ? ((s.spacing ?? 0) * size) / 2 : 0;
  ctx.translate(x + trail, y);
  if (s.skew) ctx.transform(1, 0, -s.skew, 1, 0, 0);
  if (s.scaleY) ctx.scale(1, s.scaleY);
  if (s.shadow) {
    ctx.fillStyle = s.shadow.color;
    ctx.fillText(value, s.shadow.dx, s.shadow.dy / (s.scaleY ?? 1));
  }
  if (s.outline) {
    ctx.lineJoin = "round";
    ctx.lineWidth = s.outline.width * 2;
    ctx.strokeStyle = s.outline.color;
    ctx.strokeText(value, 0, 0);
  }
  ctx.fillStyle = s.color;
  ctx.fillText(value, 0, 0);
  ctx.restore();
  return width;
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function heart(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.9);
  ctx.bezierCurveTo(cx - r * 1.4, cy - r * 0.1, cx - r * 0.7, cy - r * 1.1, cx, cy - r * 0.45);
  ctx.bezierCurveTo(cx + r * 0.7, cy - r * 1.1, cx + r * 1.4, cy - r * 0.1, cx, cy + r * 0.9);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Slanted bar (parallelogram), the sporty stripe used across the portfolio's jerseys. */
function slant(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, h: number, lean: number, color: string) {
  ctx.beginPath();
  ctx.moveTo(x0 + lean, y - h / 2);
  ctx.lineTo(x1 + lean, y - h / 2);
  ctx.lineTo(x1 - lean, y + h / 2);
  ctx.lineTo(x0 - lean, y + h / 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** Banner with swallow-tail ends. */
function ribbon(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, color: string) {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const tail = h * 0.55;
  ctx.beginPath();
  ctx.moveTo(x0 - tail, cy - h / 2);
  ctx.lineTo(x1 + tail, cy - h / 2);
  ctx.lineTo(x1, cy);
  ctx.lineTo(x1 + tail, cy + h / 2);
  ctx.lineTo(x0 - tail, cy + h / 2);
  ctx.lineTo(x0, cy);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** Two curved branches of leaves, open at the top. */
function laurel(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color;
  for (const side of [-1, 1]) {
    // Stem from the lowest leaf (just off the bottom) up to the top leaf.
    ctx.beginPath();
    ctx.lineWidth = r * 0.02;
    ctx.strokeStyle = color;
    if (side > 0) ctx.arc(cx, cy, r, -0.6, 1.32);
    else ctx.arc(cx, cy, r, Math.PI - 1.32, Math.PI + 0.6);
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const a = Math.PI - 0.25 - i * 0.24; // from near the bottom, up the side
      const px = cx + side * r * Math.sin(a);
      const py = cy - r * Math.cos(a);
      const tangent = Math.atan2(r * Math.sin(a), side * r * Math.cos(a));
      for (const out of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(
          px + out * Math.cos(tangent + Math.PI / 2) * r * 0.07,
          py + out * Math.sin(tangent + Math.PI / 2) * r * 0.07,
          r * 0.1,
          r * 0.04,
          tangent + out * 0.5,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }
}

/** Seeded random numbers, so the confetti lands in the same place in the preview and on the shirt. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const up = (s: string | undefined) => (s ?? "").trim().toUpperCase();

// Palette
const WHITE = "#FFFFFF";
const INK = "#141414";
const GOLD = "#E2B33C";
const RED = "#D7262E";
const NAVY = "#1B2A4A";
const TEAL = "#1E9A8A";
const GREEN = "#1F6B3A";

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const SHIRT_TEMPLATES: ShirtTemplate[] = [
  {
    id: "team-jersey",
    name: "Team jersey",
    description: "Team name on the front, player name and number on the back",
    shirtColor: "#1B2A4A",
    shirtLabel: "Navy",
    fields: [
      { key: "team", label: "Team name", sample: "Eagles", maxLength: 20 },
      { key: "surname", label: "Player surname", sample: "Dela Cruz", maxLength: 20, hint: "Printed on the back" },
      { key: "number", label: "Jersey number", sample: "10", maxLength: 3, numeric: true },
    ],
    pieces: [
      {
        id: "front",
        label: "Front",
        placement: "front",
        y: 1.42,
        width: 0.4,
        height: 0.22,
        draw(ctx, w, h, v, f) {
          slant(ctx, w * 0.1, w * 0.9, h * 0.8, h * 0.08, w * 0.03, GOLD);
          slant(ctx, w * 0.2, w * 0.8, h * 0.93, h * 0.04, w * 0.02, WHITE);
          text(ctx, f, up(v.team), w / 2, h * 0.4, {
            size: h * 0.58,
            maxWidth: w * 0.9,
            color: WHITE,
            skew: 0.18,
            shadow: { dx: w * 0.012, dy: w * 0.012, color: GOLD },
          });
        },
      },
      {
        id: "back",
        label: "Back",
        placement: "back",
        y: 1.33,
        width: 0.4,
        height: 0.46,
        draw(ctx, w, h, v, f) {
          text(ctx, f, up(v.surname), w / 2, h * 0.1, { size: h * 0.12, maxWidth: w * 0.92, color: WHITE, spacing: 0.06 });
          text(ctx, f, up(v.number), w / 2, h * 0.58, {
            size: h * 0.6,
            maxWidth: w * 0.86,
            color: WHITE,
            outline: { color: GOLD, width: h * 0.018 },
            scaleY: 1.08,
          });
        },
      },
    ],
  },
  {
    id: "batch-reunion",
    name: "Batch reunion",
    description: "Big batch year with a homecoming banner",
    shirtColor: "#FFFFFF",
    shirtLabel: "White",
    fields: [
      { key: "year", label: "Batch year", sample: "1998", maxLength: 4, numeric: true },
      { key: "event", label: "Event name", sample: "Grand Homecoming 2026", maxLength: 28 },
      { key: "school", label: "School or group", sample: "Alumni Association", maxLength: 30, hint: "Optional" },
    ],
    pieces: [
      {
        id: "front",
        label: "Front",
        placement: "front",
        y: 1.36,
        width: 0.42,
        height: 0.42,
        draw(ctx, w, h, v, f) {
          // Party bunting along the top
          const colors = [RED, NAVY, GOLD, TEAL];
          ctx.strokeStyle = NAVY;
          ctx.lineWidth = w * 0.004;
          ctx.beginPath();
          ctx.moveTo(w * 0.03, h * 0.05);
          ctx.quadraticCurveTo(w / 2, h * 0.17, w * 0.97, h * 0.05);
          ctx.stroke();
          for (let i = 0; i < 11; i++) {
            const t = (i + 0.5) / 11;
            const x = w * (0.03 + 0.94 * t);
            const y = h * (0.05 + 0.24 * t * (1 - t));
            ctx.beginPath();
            ctx.moveTo(x - w * 0.03, y);
            ctx.lineTo(x + w * 0.03, y);
            ctx.lineTo(x, y + h * 0.075);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
          }
          // Confetti down both sides
          const rand = seeded(1998);
          for (let i = 0; i < 28; i++) {
            const left = i % 2 === 0;
            const x = left ? w * (0.02 + rand() * 0.1) : w * (0.88 + rand() * 0.1);
            const y = h * (0.22 + rand() * 0.5);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rand() * Math.PI);
            ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
            ctx.fillRect(-w * 0.01, -w * 0.005, w * 0.02, w * 0.01);
            ctx.restore();
          }
          text(ctx, f, "BATCH", w / 2, h * 0.27, { size: h * 0.09, maxWidth: w * 0.6, color: NAVY, spacing: 0.35 });
          text(ctx, f, up(v.year), w / 2, h * 0.49, {
            size: h * 0.33,
            maxWidth: w * 0.74,
            color: RED,
            shadow: { dx: w * 0.012, dy: w * 0.012, color: NAVY },
          });
          ribbon(ctx, w / 2, h * 0.73, w * 0.78, h * 0.11, NAVY);
          text(ctx, f, up(v.event), w / 2, h * 0.73, { size: h * 0.06, maxWidth: w * 0.72, color: WHITE, spacing: 0.06 });
          text(ctx, f, up(v.school), w / 2, h * 0.88, { size: h * 0.045, maxWidth: w * 0.8, color: NAVY, spacing: 0.14, weight: 600 });
        },
      },
      {
        id: "back",
        label: "Back",
        placement: "back",
        y: 1.52,
        width: 0.34,
        height: 0.08,
        draw(ctx, w, h, v, f) {
          const width = text(ctx, f, `CLASS OF ${up(v.year)}`, w / 2, h / 2, {
            size: h * 0.55,
            maxWidth: w * 0.7,
            color: NAVY,
            spacing: 0.12,
          });
          const gap = w * 0.03;
          ctx.fillStyle = RED;
          ctx.fillRect(w * 0.02, h * 0.47, w / 2 - width / 2 - gap - w * 0.02, h * 0.06);
          ctx.fillRect(w / 2 + width / 2 + gap, h * 0.47, w / 2 - width / 2 - gap - w * 0.02, h * 0.06);
        },
      },
    ],
  },
  {
    id: "club-officer",
    name: "Club officer",
    description: "Group badge on the chest, name and position on the back",
    shirtColor: "#B31218",
    shirtLabel: "Red",
    fields: [
      { key: "org", label: "Group or club name", sample: "Youth Council", maxLength: 24 },
      { key: "surname", label: "Surname", sample: "Santos", maxLength: 20 },
      { key: "position", label: "Position", sample: "President", maxLength: 18 },
    ],
    pieces: [
      {
        id: "badge",
        label: "Chest badge",
        placement: "front",
        x: 0.13,
        y: 1.47,
        width: 0.13,
        height: 0.13,
        draw(ctx, w, h, v, f) {
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, w * 0.48, 0, Math.PI * 2);
          ctx.fillStyle = INK;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, w * 0.41, 0, Math.PI * 2);
          ctx.lineWidth = w * 0.03;
          ctx.strokeStyle = WHITE;
          ctx.stroke();
          text(ctx, f, initialsOf(v.org ?? ""), w / 2, h * 0.46, { size: h * 0.34, maxWidth: w * 0.56, color: WHITE });
          for (const dx of [-0.12, 0, 0.12]) star(ctx, w * (0.5 + dx), h * 0.7, w * 0.045, GOLD);
        },
      },
      {
        id: "back",
        label: "Back",
        placement: "back",
        y: 1.4,
        width: 0.42,
        height: 0.3,
        draw(ctx, w, h, v, f) {
          text(ctx, f, up(v.org), w / 2, h * 0.1, { size: h * 0.075, maxWidth: w * 0.86, color: WHITE, spacing: 0.22 });
          text(ctx, f, up(v.surname), w / 2, h * 0.42, { size: h * 0.3, maxWidth: w * 0.94, color: WHITE });
          slant(ctx, w * 0.1, w * 0.9, h * 0.75, h * 0.16, w * 0.025, INK);
          text(ctx, f, up(v.position), w / 2, h * 0.75, { size: h * 0.09, maxWidth: w * 0.7, color: WHITE, spacing: 0.25 });
        },
      },
    ],
  },
  {
    id: "fun-run",
    name: "Fun run / event",
    description: "Bold event title with a slogan and date",
    shirtColor: "#C9A227",
    shirtLabel: "Gold",
    fields: [
      { key: "event", label: "Event name", sample: "Fun Run 2026", maxLength: 20 },
      { key: "slogan", label: "Slogan", sample: "Run for a cause", maxLength: 26 },
      { key: "when", label: "Date and place", sample: "March 15 · Silay City", maxLength: 30, hint: "Optional" },
    ],
    pieces: [
      {
        id: "front",
        label: "Front",
        placement: "front",
        y: 1.37,
        width: 0.42,
        height: 0.36,
        draw(ctx, w, h, v, f) {
          const width = text(ctx, f, up(v.event), w * 0.6, h * 0.3, {
            size: h * 0.26,
            maxWidth: w * 0.72,
            color: INK,
            skew: 0.2,
          });
          // Speed lines trailing off the title, longest in the middle
          const left = w * 0.6 - width / 2 - w * 0.04;
          ctx.fillStyle = WHITE;
          [
            [0.21, 0.1],
            [0.29, 0.02],
            [0.37, 0.07],
          ].forEach(([y, start]) => {
            if (left - w * start > w * 0.05) ctx.fillRect(w * start, h * y, left - w * start, h * 0.03);
          });
          slant(ctx, w * 0.08, w * 0.92, h * 0.6, h * 0.15, w * 0.03, INK);
          text(ctx, f, up(v.slogan), w / 2, h * 0.6, { size: h * 0.075, maxWidth: w * 0.74, color: GOLD, skew: 0.15, spacing: 0.06 });
          text(ctx, f, up(v.when), w / 2, h * 0.84, { size: h * 0.06, maxWidth: w * 0.86, color: INK, spacing: 0.1 });
        },
      },
      {
        id: "back",
        label: "Back",
        placement: "back",
        y: 1.42,
        width: 0.36,
        height: 0.2,
        draw(ctx, w, h, v, f) {
          text(ctx, f, up(v.event), w / 2, h * 0.14, { size: h * 0.12, maxWidth: w * 0.8, color: INK, spacing: 0.2 });
          text(ctx, f, "FINISHER", w / 2, h * 0.52, { size: h * 0.38, maxWidth: w * 0.94, color: WHITE, skew: 0.18 });
          for (const dx of [-0.1, 0, 0.1]) star(ctx, w * (0.5 + dx), h * 0.86, h * 0.07, INK);
        },
      },
    ],
  },
  {
    id: "business",
    name: "Business uniform",
    description: "Shop name on the chest, name and contact number on the back",
    shirtColor: "#0A0A0A",
    shirtLabel: "Black",
    fields: [
      { key: "name", label: "Business name", sample: "Silay Bakeshop", maxLength: 22 },
      { key: "tagline", label: "Tagline", sample: "Freshly baked every day", maxLength: 32, hint: "Optional" },
      { key: "contact", label: "Phone or Facebook page", sample: "0912 345 6789", maxLength: 24, hint: "Optional" },
    ],
    pieces: [
      {
        id: "chest",
        label: "Chest logo",
        placement: "front",
        x: 0.12,
        y: 1.47,
        width: 0.17,
        height: 0.1,
        draw(ctx, w, h, v, f) {
          text(ctx, f, up(v.name), w / 2, h * 0.4, { size: h * 0.3, maxWidth: w * 0.94, color: WHITE });
          ctx.fillStyle = RED;
          ctx.fillRect(w * 0.3, h * 0.68, w * 0.4, h * 0.05);
        },
      },
      {
        id: "back",
        label: "Back",
        placement: "back",
        y: 1.4,
        width: 0.42,
        height: 0.3,
        draw(ctx, w, h, v, f) {
          text(ctx, f, up(v.name), w / 2, h * 0.26, { size: h * 0.24, maxWidth: w * 0.94, color: WHITE });
          ctx.fillStyle = RED;
          ctx.fillRect(w * 0.4, h * 0.45, w * 0.2, h * 0.025);
          text(ctx, f, (v.tagline ?? "").trim(), w / 2, h * 0.6, { size: h * 0.085, maxWidth: w * 0.9, color: WHITE, weight: 500 });
          const contact = (v.contact ?? "").trim();
          if (contact) {
            ctx.font = `700 ${Math.round(h * 0.075)}px ${f}`;
            const pill = Math.min(w * 0.9, ctx.measureText(contact).width + w * 0.12);
            ctx.fillStyle = RED;
            ctx.fillRect(w / 2 - pill / 2, h * 0.76, pill, h * 0.15);
            text(ctx, f, contact, w / 2, h * 0.835, { size: h * 0.075, maxWidth: pill - w * 0.08, color: WHITE });
          }
        },
      },
    ],
  },
  {
    id: "family-reunion",
    name: "Family reunion",
    description: "Family name in a leaf wreath with the year",
    shirtColor: "#FFFFFF",
    shirtLabel: "White",
    fields: [
      { key: "family", label: "Family name", sample: "Reyes", maxLength: 22 },
      { key: "year", label: "Year", sample: "2026", maxLength: 4, numeric: true },
      { key: "place", label: "Place", sample: "Silay City", maxLength: 24, hint: "Optional" },
    ],
    pieces: [
      {
        id: "front",
        label: "Front",
        placement: "front",
        y: 1.36,
        width: 0.4,
        height: 0.42,
        draw(ctx, w, h, v, f) {
          // Wreath around the name; the year and place sit below it, clear of the leaves.
          laurel(ctx, w / 2, h * 0.4, w * 0.34, GREEN);
          heart(ctx, w / 2, h * 0.1, w * 0.035, RED);
          text(ctx, f, "THE", w / 2, h * 0.22, { size: h * 0.055, maxWidth: w * 0.3, color: GREEN, spacing: 0.4 });
          text(ctx, f, up(v.family), w / 2, h * 0.37, { size: h * 0.17, maxWidth: w * 0.52, color: GREEN });
          ribbon(ctx, w / 2, h * 0.56, w * 0.72, h * 0.095, RED);
          text(ctx, f, "FAMILY REUNION", w / 2, h * 0.56, { size: h * 0.05, maxWidth: w * 0.66, color: WHITE, spacing: 0.12 });
          text(ctx, f, up(v.year), w / 2, h * 0.82, { size: h * 0.12, maxWidth: w * 0.5, color: GREEN, spacing: 0.08 });
          text(ctx, f, up(v.place), w / 2, h * 0.94, { size: h * 0.045, maxWidth: w * 0.8, color: "#555555", spacing: 0.16, weight: 600 });
        },
      },
      {
        id: "back",
        label: "Back",
        placement: "back",
        y: 1.52,
        width: 0.3,
        height: 0.08,
        draw(ctx, w, h, _v, f) {
          const width = text(ctx, f, "FAMILY FIRST", w / 2, h / 2, { size: h * 0.55, maxWidth: w * 0.62, color: GREEN, spacing: 0.14 });
          heart(ctx, w / 2 - width / 2 - w * 0.1, h / 2, h * 0.28, RED);
          heart(ctx, w / 2 + width / 2 + w * 0.08, h / 2, h * 0.28, RED);
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Browser-only rendering
// ---------------------------------------------------------------------------

/** The site's headline font (Space Grotesk via next/font), loaded so the canvas can use it. */
export async function loadTemplateFont(): Promise<string> {
  const fromCss = getComputedStyle(document.documentElement).getPropertyValue("--font-space-grotesk").trim();
  const family = `${fromCss || '"Space Grotesk"'}, Arial, sans-serif`;
  try {
    await document.fonts.load(`700 64px ${family}`);
    await document.fonts.load(`500 64px ${family}`);
  } catch {
    // Falls back to Arial; the design still works.
  }
  return family;
}

/** Paints one piece to a transparent PNG data URL, `px` pixels wide, matching the piece's shape. */
export function renderPiece(piece: TemplatePiece, values: Values, family: string, px = 800): string {
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = Math.round((px * piece.height) / piece.width);
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  piece.draw(ctx, canvas.width, canvas.height, values, family);
  return canvas.toDataURL("image/png");
}
