import { Bar, HeaderSkeleton, PanelSkeleton } from "@/components/dashboard/skeletons";

/** Mirrors the order page: header + pipeline, items/activity left, job/payments/message right. */
export default function OrderDetailLoading() {
  return (
    <div className="max-w-6xl space-y-6" role="status" aria-label="Loading order">
      <HeaderSkeleton back actions={3} />
      <div className="grid grid-cols-5 gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Bar className="h-1" />
            <Bar className="h-2.5 w-14 bg-surface-container" />
          </div>
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PanelSkeleton rows={2} />
          <PanelSkeleton rows={2} />
          <div className="space-y-4 bg-surface-container-low p-5" aria-hidden>
            <Bar className="h-4 w-36" />
            <Bar className="h-16 w-full bg-surface-container" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Bar className="h-7 w-7 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Bar className="h-3.5 w-3/4 bg-surface-container" />
                  <Bar className="h-3 w-28 bg-surface-container" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <PanelSkeleton rows={4} />
          <div className="space-y-3 bg-surface-container-low p-5" aria-hidden>
            <Bar className="h-4 w-24" />
            <Bar className="h-4 w-full bg-surface-container" />
            <Bar className="h-4 w-full bg-surface-container" />
            <Bar className="h-1.5 w-full" />
            <Bar className="ml-auto h-8 w-32" />
          </div>
          <PanelSkeleton rows={2} />
        </div>
      </div>
    </div>
  );
}
