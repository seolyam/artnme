export default function DashboardLoading() {
  return (
    <div className="space-y-8 max-w-6xl animate-in fade-in duration-300">
      {/* Header skeleton */}
      <header className="flex flex-col gap-2 pb-2">
        <div className="h-3 w-16 bg-surface-container-high animate-pulse" />
        <div className="h-9 w-52 bg-surface-container-high animate-pulse" />
      </header>

      {/* Stats grid skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 p-5 bg-surface-container-low">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-surface-container-high animate-pulse" />
              <div className="h-4 w-4 bg-surface-container-high animate-pulse" />
            </div>
            <div className="h-8 w-14 bg-surface-container-high animate-pulse" />
          </div>
        ))}
      </div>

      {/* Recent orders skeleton */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-36 bg-surface-container-high animate-pulse" />
          <div className="h-3 w-16 bg-surface-container-high animate-pulse" />
        </div>
        <div className="flex flex-col">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-4 bg-surface-container-lowest ${
                i !== 4 ? "border-b border-surface-container-high" : ""
              }`}
            >
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-40 bg-surface-container-high animate-pulse" />
                  <div className="h-4 w-16 bg-surface-container-high animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-24 bg-surface-container animate-pulse" />
                  <div className="h-3 w-16 bg-surface-container animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="h-4 w-16 bg-surface-container-high animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
