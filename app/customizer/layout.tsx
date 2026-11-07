import { Inter, Merriweather, Outfit } from "next/font/google";

// The 3D Studio's "Add text" fonts (Space Grotesk already comes from the root layout).
// Only this page downloads them. See lib/customizer/fonts.ts.
const inter = Inter({ subsets: ["latin"], variable: "--font-studio-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-studio-outfit" });
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-studio-merriweather",
});

export default function CustomizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-studio-fonts className={`contents ${inter.variable} ${outfit.variable} ${merriweather.variable}`}>
      {children}
    </div>
  );
}
