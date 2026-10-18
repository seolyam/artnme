import { HeaderSkeleton, ListSkeleton } from "@/components/dashboard/skeletons";

export default function StaffLoading() {
  return (
    <div className="max-w-5xl space-y-6" role="status" aria-label="Loading staff">
      <HeaderSkeleton />
      <ListSkeleton rows={4} />
    </div>
  );
}
