import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tonal section block used across the order and customer pages. */
export function Panel({
  icon: Icon,
  title,
  action,
  className,
  children,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("bg-surface-container-low p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-headline text-sm font-bold uppercase tracking-[0.04em]">
          {Icon && <Icon className="h-4 w-4 text-on-surface-variant" />}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
