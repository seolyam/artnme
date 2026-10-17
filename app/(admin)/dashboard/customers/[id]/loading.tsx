import { Bar, HeaderSkeleton, ListSkeleton, PanelSkeleton, TilesSkeleton } from "@/components/dashboard/skeletons";

export default function CustomerDetailLoading() {
  return (
    <div className="max-w-6xl space-y-6" role="status" aria-label="Loading customer">
      <HeaderSkeleton back actions={2} />
      <div className="flex gap-2" aria-hidden>
        <Bar className="h-11 w-44" />
        <Bar className="h-11 w-24" />
        <Bar className="h-11 w-36" />
      </div>
      <TilesSkeleton count={4} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-3 bg-surface-container-low p-5 lg:col-span-2">
          <Bar className="h-4 w-36" />
          <ListSkeleton rows={3} />
        </div>
        <div className="space-y-6">
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={2} />
        </div>
      </div>
    </div>
  );
}
