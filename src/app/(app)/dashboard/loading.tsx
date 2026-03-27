export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="h-8 w-40 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-64 rounded-lg bg-gray-100 dark:bg-gray-800 mt-2" />
        </div>
        <div className="h-9 w-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Stats — matches StatsCards two-tier layout */}
      <div>
        {/* Tier 1: hero big numbers */}
        <div className="flex flex-wrap gap-8 pb-6 mb-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800 mb-2" />
            <div className="h-10 w-44 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div>
            <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800 mb-2" />
            <div className="h-9 w-40 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        {/* Tier 2: secondary stats */}
        <div className="flex flex-wrap gap-6 md:gap-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800 mb-1" />
              <div className="h-5 w-28 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-50 dark:bg-gray-800/50" />
          ))}
        </div>
      </div>

      {/* Charts Row: Pie chart + Quick Stats card */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700 mb-6" />
          <div className="h-48 rounded-xl bg-gray-50 dark:bg-gray-800/50" />
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700 mb-6" />
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-gray-50 dark:bg-gray-800/50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
