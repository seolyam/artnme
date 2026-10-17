import { cn } from "@/lib/utils";

/** Square-capped arrow used on every primary action. */
export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      className={cn("h-5 w-5", className)}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Press registration mark from the print-floor motif set. */
export function RegistrationMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className={className}>
      <circle cx="32" cy="32" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="8" fill="#e31e24" />
      <path d="M32 2v60M2 32h60" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
