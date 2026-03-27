export default function AnalysisLoading() {
  return (
    <div className="space-y-6 md:space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-36 rounded-lg bg-muted" />
        <div className="h-4 w-72 rounded-lg bg-muted/70 mt-2" />
      </div>

      {/* Stats strip */}
      <div>
        <div className="flex flex-wrap gap-8 pb-6 mb-6 border-b">
          <div>
            <div className="h-3 w-20 rounded bg-muted/70 mb-2" />
            <div className="h-10 w-44 rounded bg-muted" />
          </div>
          <div>
            <div className="h-3 w-28 rounded bg-muted/70 mb-2" />
            <div className="h-9 w-40 rounded bg-muted" />
          </div>
        </div>
        <div className="flex flex-wrap gap-6 md:gap-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 rounded bg-muted/70 mb-1" />
              <div className="h-5 w-28 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="h-5 w-32 rounded bg-muted mb-6" />
          <div className="h-48 rounded-xl bg-muted/50" />
        </div>
        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="h-5 w-32 rounded bg-muted mb-6" />
          <div className="h-48 rounded-xl bg-muted/50" />
        </div>
      </div>

      {/* Tables */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-card p-6 shadow-sm">
            <div className="h-5 w-48 rounded bg-muted mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-10 rounded-lg bg-muted/50" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
