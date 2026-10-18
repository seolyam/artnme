import { Bar, HeaderSkeleton } from "@/components/dashboard/skeletons";

export default function AccountLoading() {
  return (
    <div className="max-w-2xl space-y-6" role="status" aria-label="Loading account">
      <HeaderSkeleton />
      {[0, 1].map((i) => (
        <div key={i} className="space-y-4 bg-surface-container-low p-5" aria-hidden>
          <Bar className="h-4 w-36" />
          <Bar className="h-11 w-full bg-surface-container" />
          {i === 1 && <Bar className="h-11 w-full bg-surface-container" />}
          <Bar className="h-10 w-28" />
        </div>
      ))}
    </div>
  );
}
