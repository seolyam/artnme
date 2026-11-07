/**
 * Carries the 3D Studio mockup to the quote form, so customers don't have to
 * download it and attach it themselves. Kept in sessionStorage (this tab
 * only, gone when it closes). The 4-angle PNG is about 0.4 MB.
 */
const KEY = "studio_mockup_for_quote";
export const MOCKUP_FILE_NAME = "3d-studio-mockup.png";

export function saveMockupForQuote(dataUrl: string) {
  try {
    window.sessionStorage.setItem(KEY, dataUrl);
    return true;
  } catch {
    return false; // Storage blocked or full: the customer can still attach a download.
  }
}

/** The handed-over mockup as a PNG data URL, or null. */
export function readMockupForQuote(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearMockupForQuote() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing stored to clear.
  }
}

export function dataUrlToFile(dataUrl: string, name: string): File | null {
  const match = /^data:(image\/(?:png|jpeg));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: match[1] });
}
