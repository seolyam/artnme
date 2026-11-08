// Shirt colors offered in the 3D Studio. Plain data (no "use client"), so the
// server can read it too, e.g. to let the AI pick a shirt color by name.

export interface PrintColor {
  name: string;
  hex: string;
}

export const PRINT_COLORS: PrintColor[] = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#0A0A0A" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Red", hex: "#B31218" },
  { name: "Ash", hex: "#9B9B9B" },
  { name: "Olive", hex: "#4A5320" },
  { name: "Heather", hex: "#B8B5B0" },
  { name: "Gold", hex: "#C9A227" },
];
