/**
 * Fonts offered by the studio's "Add text". They are loaded by
 * app/customizer/layout.tsx (next/font) and exposed as CSS variables on the
 * [data-studio-fonts] wrapper, because the text is drawn onto a canvas, which
 * only knows a font by its real (generated) family name. Browser-only helpers.
 */
const CSS_VARS: Record<string, string> = {
  Inter: "--font-studio-inter",
  "Space Grotesk": "--font-space-grotesk",
  Merriweather: "--font-studio-merriweather",
  Outfit: "--font-studio-outfit",
};

/** CSS font-family list for a font choice, with Arial as the fallback. */
export function studioFontStack(choice: string) {
  const name = CSS_VARS[choice];
  const host = document.querySelector("[data-studio-fonts]") ?? document.documentElement;
  const family = name ? getComputedStyle(host).getPropertyValue(name).trim() : "";
  return `${family || `"${choice}"`}, Arial, sans-serif`;
}

/** Downloads the font if needed, so the canvas doesn't draw with the fallback. */
export async function loadStudioFont(choice: string) {
  try {
    await document.fonts.load(`900 100px ${studioFontStack(choice)}`);
  } catch {
    // Draws with the fallback font instead.
  }
}
