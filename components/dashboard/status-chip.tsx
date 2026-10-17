import { statusStyle } from "@/lib/order-status";
import { cn } from "@/lib/utils";

/** The status badge used on every list: colored square + mono label. */
export function StatusChip({
  status,
  full = false,
  className,
}: {
  status: string;
  /** Show "Ready for Pickup" instead of the short "Ready". */
  full?: boolean;
  className?: string;
}) {
  const s = statusStyle(status);
  return (
    <span
      className={cn(
        "spec inline-flex shrink-0 items-center gap-1.5 px-1.5 py-0.5 text-[10px] tracking-[0.1em]",
        s.text,
        s.soft,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5", s.dot)} />
      {full ? status : s.short}
    </span>
  );
}
