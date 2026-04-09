import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-headline",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://artnme.vercel.app"),
  title: "Art 'n Me — Digital Printing Services and Studios",
  description:
    "Silay City's premier destination for high-quality tarpaulins, custom apparel, and personalized souvenirs. Where Creativity Belongs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${manrope.variable} antialiased bg-background text-on-background min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
