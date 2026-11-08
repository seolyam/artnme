import { Inter, Merriweather, Outfit } from "next/font/google";
import { StudioAiProvider } from "@/components/customizer/studio-ai";
import { aiPublicEnabled } from "@/lib/ai/flags";

// The 3D Studio's "Add text" fonts (Space Grotesk already comes from the root layout).
// Only this page downloads them. See lib/customizer/fonts.ts.
const inter = Inter({ subsets: ["latin"], variable: "--font-studio-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-studio-outfit" });
// Variable font: one file covers every weight (300-900), so the build fetches 1 file, not 3.
const merriweather = Merriweather({ subsets: ["latin"], variable: "--font-studio-merriweather" });

export default function CustomizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-studio-fonts className={`contents ${inter.variable} ${outfit.variable} ${merriweather.variable}`}>
      <StudioAiProvider enabled={aiPublicEnabled()}>{children}</StudioAiProvider>
    </div>
  );
}
