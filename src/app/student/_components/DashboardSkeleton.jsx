import { Card } from "@/components/ui/Card";

const Bar = ({ className }) => <div className={`animate-pulse rounded-md bg-cream-300 ${className}`} />;

/** Placeholder shapes that match the real stat cards, seat layout and chart while data loads. */
export function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading seat availability" className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`rounded-2xl border border-line bg-surface p-5 shadow-card ${i === 0 ? "col-span-2 lg:col-span-1" : ""}`}>
            <Bar className="h-3.5 w-20" />
            <Bar className="mt-4 h-10 w-16" />
          </div>
        ))}
      </div>
      <Card>
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <Bar className="h-5 w-28" />
          <Bar className="hidden h-4 w-72 sm:block" />
        </div>
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex aspect-square flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-line p-2">
              <Bar className="h-8 w-10" />
              <Bar className="h-3 w-12" />
              <Bar className="h-2.5 w-14" />
            </div>
          ))}
        </div>
      </Card>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function TrendsSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-3 flex items-center gap-3"><Bar className="h-6 w-40" /><Bar className="h-6 w-44 rounded-full" /></div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3"><Bar className="h-4 w-48" /><Bar className="mt-5 h-48 w-full" /></Card>
        <Card className="p-5 lg:col-span-2">
          <Bar className="h-4 w-52" />
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="mt-5 flex justify-between"><Bar className="h-4 w-28" /><Bar className="h-5 w-32" /></div>)}
        </Card>
      </div>
    </div>
  );
}
