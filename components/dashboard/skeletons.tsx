import { cn } from "@/lib/utils";

/** A pulsing placeholder block in the portal's tonal palette. */
export function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-surface-container-high", className)} />;
}

export function HeaderSkeleton({ back = false, actions = 0 }: { back?: boolean; actions?: number }) {
  return (
    <div className="space-y-4" aria-hidden>
      {back && <Bar className="h-3 w-28" />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Bar className="h-3 w-32" />
          <Bar className="h-10 w-64 md:h-12" />
          <Bar className="h-3.5 w-80 max-w-full" />
        </div>
        {actions > 0 && (
          <div className="flex gap-2">
            {Array.from({ length: actions }).map((_, i) => (
              <Bar key={i} className="h-12 w-32" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PanelSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3 bg-surface-container-low p-5", className)} aria-hidden>
      <Bar className="mb-2 h-4 w-28" />
      {Array.from({ length: rows }).map((_, i) => (
        <Bar key={i} className="h-10 w-full bg-surface-container" />
      ))}
    </div>
  );
}

export function TilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className={cn(
        "grid gap-0.5 border-2 border-surface-container-high bg-surface-container-high sm:grid-cols-2",
        count === 4 ? "lg:grid-cols-4" : count === 5 ? "lg:grid-cols-3 xl:grid-cols-5" : "lg:grid-cols-3",
      )}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 bg-surface-container-low p-5">
          <Bar className="h-3 w-20" />
          <Bar className="h-8 w-28" />
          <Bar className="h-3 w-24 bg-surface-container" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-outline-variant/30 border border-outline-variant/30" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 bg-surface-container-lowest px-4 py-4">
          <div className="flex-1 space-y-2">
            <Bar className="h-4 w-56 max-w-full" />
            <Bar className="h-3 w-36 bg-surface-container" />
          </div>
          <Bar className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
