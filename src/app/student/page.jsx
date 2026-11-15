"use client";

import { AlertTriangle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MessageCard } from "@/components/ui/MessageCard";
import { DashboardSkeleton, TrendsSkeleton } from "@/app/student/_components/DashboardSkeleton";
import { LiveSeatLayout } from "@/app/student/_components/SeatLayout";
import { SeatStatCard } from "@/components/seats/SeatStatCard";
import { UsageTrends } from "@/app/student/_components/UsageTrends";
import { useLibrary } from "@/context/LibraryContext";
import { LibraryHoursCard } from "@/app/student/_components/LibraryHoursCard";

export default function StudentDashboard() {
  const { library, publicSeatCounts: c, feedStatus, retryFeed, libraryOpen, libraryHoursText } = useLibrary();
  const ready = feedStatus === "ready";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">{library.name}</h1>
          <p className="mt-1.5 text-sm text-muted sm:text-base">Check which seats are free before you head over.</p>
        </div>
        <LibraryHoursCard />
      </header>

      <section aria-labelledby="live-title">
        <h2 id="live-title" className="mb-3 font-display text-xl font-medium">Seat availability</h2>
        {feedStatus === "loading" && <DashboardSkeleton />}
        {feedStatus === "offline" && (
          <MessageCard icon={WifiOff} title="Seat availability is unavailable" text="We can't reach the live seat data right now. Please check again in a moment." />
        )}
        {feedStatus === "error" && (
          <MessageCard icon={AlertTriangle} title="Something went wrong" text="We couldn't load seat availability. Please try again." action={<Button variant="primary" onClick={retryFeed}>Try again</Button>} />
        )}
        {ready && !libraryOpen && (
          <p role="status" className="mb-4 rounded-xl border border-warn-100 bg-warn-50 px-4 py-3 text-sm font-medium text-warn-700">
            {libraryHoursText}. Seats can be used and reserved when the library opens.
          </p>
        )}
        {ready && (<>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div><SeatStatCard label="Total seats" value={c.total} total={c.total} suffix="seats" tone="neutral" /></div>
          <SeatStatCard label="Available" value={c.available} total={c.total} tone="ok" />
          <SeatStatCard label="Occupied" value={c.occupied} total={c.total} tone="brand" />
          <SeatStatCard label="Reserved" value={c.reserved} total={c.total} tone="warn" />
        </div>
        <div className="mt-5"><LiveSeatLayout /></div>
        </>)}
      </section>

      {feedStatus === "loading" && <TrendsSkeleton />}
      {ready && <UsageTrends />}
    </div>
  );
}

