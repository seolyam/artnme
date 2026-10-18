import { Bar, HeaderSkeleton } from "@/components/dashboard/skeletons";

export default function OrdersLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading orders">
      <HeaderSkeleton actions={1} />
      <div className="flex flex-col gap-2 sm:flex-row" aria-hidden>
        <Bar className="h-10 flex-1" />
        <Bar className="h-10 w-full sm:w-44" />
      </div>
      <div className="space-y-3 md:hidden" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <Bar key={i} className="h-12 w-full bg-surface-container-low" />
        ))}
      </div>
      <div className="hidden auto-cols-[minmax(250px,1fr)] grid-flow-col gap-3 overflow-hidden md:grid" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-h-[420px] space-y-2 border-t-[3px] border-surface-container-high bg-surface-container-low p-2">
            <Bar className="m-1 h-4 w-24" />
            {Array.from({ length: i % 2 === 0 ? 2 : 1 }).map((_, j) => (
              <Bar key={j} className="h-36 w-full bg-surface-container" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
