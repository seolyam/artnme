"use client";

import { ErrorFallback } from "@/components/error-fallback";

/** Customer pages: shown inside the site's menu and footer, so customers aren't stranded. */
export default function PublicError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorFallback {...props} />;
}
