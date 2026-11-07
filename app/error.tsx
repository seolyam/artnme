"use client";

import { ErrorFallback } from "@/components/error-fallback";

/** Pages outside the customer layout (the 3D Studio, login, welcome). The staff dashboard has its own. */
export default function RootError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorFallback {...props} />;
}
