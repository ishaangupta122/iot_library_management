"use client";

import { AlertTriangle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MessageCard } from "@/components/ui/MessageCard";
import { DashboardSkeleton, TrendsSkeleton } from "@/app/student/_components/DashboardSkeleton";
import { LiveSeatLayout } from "@/app/student/_components/LiveSeatLayout";
import { SeatStatCard } from "@/components/seats/SeatStatCard";
import { UsageTrends } from "@/app/student/_components/UsageTrends";
import { useLibrary } from "@/context/LibraryContext";

/** The whole public site: live status, seat layout, and when to visit. */
export default function StudentDashboard() {
  const { library, seatCounts: c, feedStatus, retryFeed } = useLibrary();
  const ready = feedStatus === "ready";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">{library.name}</h1>
        <p className="mt-1.5 text-sm text-muted sm:text-base">Check which seats are free before you head over.</p>
      </header>

      <section aria-labelledby="live-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="live-title" className="font-display text-xl font-medium">Seat availability</h2>
          <StatusTag status={feedStatus} />
        </div>
        {feedStatus === "loading" && <DashboardSkeleton />}
        {feedStatus === "offline" && (
          <MessageCard icon={WifiOff} title="Seat availability is unavailable" text="We can't reach the live seat data right now. Please check again in a moment." />
        )}
        {feedStatus === "error" && (
          <MessageCard icon={AlertTriangle} title="Something went wrong" text="We couldn't load seat availability. Please try again." action={<Button variant="primary" onClick={retryFeed}>Try again</Button>} />
        )}
        {ready && (<>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1"><SeatStatCard label="Total seats" value={c.total} total={c.total} suffix="seats" tone="neutral" /></div>
          <SeatStatCard label="Available" value={c.available} total={c.total} tone="ok" />
          <SeatStatCard label="Occupied" value={c.occupied} total={c.total} tone="brand" />
          <SeatStatCard label="Reserved" value={c.reserved} total={c.total} tone="warn" />
          <SeatStatCard label="Unavailable" value={c.unavailable} total={c.total} tone="neutral" />
        </div>
        <div className="mt-5"><LiveSeatLayout /></div>
        </>)}
      </section>

      {feedStatus === "loading" && <TrendsSkeleton />}
      {ready && <UsageTrends />}
    </div>
  );
}

const TAGS = {
  ready: { label: "Live", pill: "border-ok-100 bg-ok-50 text-ok-700", dot: "bg-ok-500", pulse: true },
  loading: { label: "Loading", pill: "border-line bg-cream-100 text-ink-soft", dot: "bg-muted", pulse: true },
  offline: { label: "Offline", pill: "border-brand-100 bg-brand-50 text-brand-700", dot: "bg-brand-600" },
  error: { label: "Error", pill: "border-brand-100 bg-brand-50 text-brand-700", dot: "bg-brand-600" },
};

function StatusTag({ status }) {
  const t = TAGS[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${t.pill}`}>
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {t.pulse && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${t.dot}`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${t.dot}`} />
      </span>
      {t.label}
    </span>
  );
}
