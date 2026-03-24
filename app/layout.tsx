import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Art 'n Me — Digital Printing Services and Studios",
  description:
    "Silay City's premier destination for high-quality tarpaulins, custom apparel, and personalized souvenirs. Where Creativity Belongs.",
  openGraph: {
    title: "Art 'n Me — Digital Printing Services and Studios",
    description: "Where Creativity Belongs 🎨 | High-quality tarpaulins, shirts, mugs, and more in Silay City.",
    url: "https://artnme.vercel.app",
    siteName: "Art 'n Me",
    locale: "en_PH",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
