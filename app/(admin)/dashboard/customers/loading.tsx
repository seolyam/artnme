import { Bar, HeaderSkeleton, ListSkeleton } from "@/components/dashboard/skeletons";

export default function CustomersLoading() {
  return (
    <div className="max-w-6xl space-y-6" role="status" aria-label="Loading customers">
      <HeaderSkeleton actions={1} />
      <div className="flex flex-col gap-2 sm:flex-row" aria-hidden>
        <Bar className="h-10 flex-1" />
        <Bar className="h-10 w-full sm:w-80" />
      </div>
      <ListSkeleton rows={8} />
    </div>
  );
}
