import { HeaderSkeleton, PanelSkeleton, TilesSkeleton } from "@/components/dashboard/skeletons";

export default function ReportsLoading() {
  return (
    <div className="max-w-5xl space-y-6" role="status" aria-label="Loading report">
      <HeaderSkeleton actions={2} />
      <TilesSkeleton count={4} />
      <div className="grid gap-6 md:grid-cols-2">
        <PanelSkeleton rows={3} />
        <PanelSkeleton rows={3} />
      </div>
      <PanelSkeleton rows={6} />
    </div>
  );
}
