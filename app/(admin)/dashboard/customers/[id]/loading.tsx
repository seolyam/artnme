export default function CustomerDetailLoading() {
  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
      <div className="flex items-start gap-4">
        <div className="h-7 w-7 bg-surface-container-high animate-pulse" />
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-surface-container-high animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-surface-container-high animate-pulse" />
            <div className="h-3 w-32 bg-surface-container-high animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-20 bg-surface-container-low animate-pulse" />
        <div className="h-20 bg-surface-container-low animate-pulse" />
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface-container-low animate-pulse" />
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-surface-container-low animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
