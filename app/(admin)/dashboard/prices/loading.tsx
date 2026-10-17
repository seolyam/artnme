import { HeaderSkeleton, PanelSkeleton } from "@/components/dashboard/skeletons";

export default function PricesLoading() {
  return (
    <div className="max-w-5xl space-y-6" role="status" aria-label="Loading prices">
      <HeaderSkeleton />
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <PanelSkeleton key={i} rows={2} />
        ))}
      </div>
    </div>
  );
}
