"use client";

import "./globals.css";
import { ErrorFallback } from "@/components/error-fallback";

/** Last resort, when the root layout itself fails: it replaces the layout, so it brings its own <html>. */
export default function GlobalError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ErrorFallback {...props} />
      </body>
    </html>
  );
}
