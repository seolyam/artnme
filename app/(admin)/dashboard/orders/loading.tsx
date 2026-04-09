export default function OrdersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-5 w-56 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid auto-cols-[minmax(240px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-w-[240px]">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-2 rounded-lg bg-muted/40 p-2 min-h-[120px]">
              {Array.from({ length: 2 }).map((_, j) => (
                <div
                  key={j}
                  className="h-32 animate-pulse rounded-lg bg-muted/60"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
