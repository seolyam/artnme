"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-full max-w-md bg-surface-container-low p-8 text-center space-y-5">
        {/* Icon with destructive accent */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" strokeWidth={2} />
        </div>

        {/* Title */}
        <h2
          className="text-xl font-bold uppercase tracking-tight"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          Something Went Wrong
        </h2>

        {/* Message */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>

        {/* Action */}
        <Button onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
