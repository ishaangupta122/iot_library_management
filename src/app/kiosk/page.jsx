"use client";

import { useEffect, useState } from "react";
import { SimulationPanel } from "@/components/SimulationPanel";
import { Card } from "@/components/ui/Card";
import { CONFIRMATION_MS, KioskConfirmation } from "@/app/kiosk/_components/KioskConfirmation";
import { KioskReserveModal } from "@/app/kiosk/_components/KioskReserveModal";
import { KioskMessage, KioskSkeleton } from "@/app/kiosk/_components/KioskStates";
import { SeatTile } from "@/components/seats/SeatTile";
import { useLibrary } from "@/context/LibraryContext";
import { formatDuration } from "@/lib/utils";

const LEGEND = [
  { label: "Available", dot: "bg-ok-700" },
  { label: "Occupied", dot: "bg-brand-700" },
  { label: "Reserved", dot: "bg-warn-700" },
  { label: "Unavailable", dot: "bg-ink-soft/60" },
];
const MODAL_IDLE_MS = 45_000;

export default function KioskApp() {
  const { library, seatViews, floors, seatCounts, settings, setClockRunning, feedStatus, retryFeed } = useLibrary();
  const ready = feedStatus === "ready";
  const [selectedId, setSelectedId] = useState(null);
  const [done, setDone] = useState(null);
  const [dev, setDev] = useState(false);
  const hold = formatDuration(settings.reservation.durationMinutes);

  useEffect(() => {
    setClockRunning(true);
    // Developer tools stay hidden on the real kiosk; open /kiosk?dev to simulate the card reader and sensors.
    setDev(new URLSearchParams(window.location.search).has("dev"));
    return () => setClockRunning(false);
  }, [setClockRunning]);

  // Walk-up kiosk: the confirmation clears itself so the next student can go straight on.
  useEffect(() => {
    if (!done) return undefined;
    const timer = setTimeout(() => setDone(null), CONFIRMATION_MS);
    return () => clearTimeout(timer);
  }, [done]);
  // Losing the connection mid-reservation: drop the open seat so nobody scans into a dead screen.
  useEffect(() => {
    if (!ready) setSelectedId(null);
  }, [ready]);
  useEffect(() => {
    if (!selectedId) return undefined;
    const timer = setTimeout(() => setSelectedId(null), MODAL_IDLE_MS);
    return () => clearTimeout(timer);
  }, [selectedId]);

  return (
    <div
      className="tight-corners flex h-dvh touch-manipulation flex-col overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col justify-center px-6 py-6 sm:px-10">
        <>
            <div className="mb-6 flex shrink-0 flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-4xl font-medium">Choose a seat</h1>
                <p className="mt-1.5 text-lg text-muted">Tap a free seat to reserve it for {hold}.</p>
              </div>
              {ready && <p className="font-display text-2xl font-medium"><span className="text-ok-700">{seatCounts.available}</span> <span className="text-lg font-normal text-muted">of {seatCounts.total} free</span></p>}
            </div>

            {feedStatus === "loading" && <KioskSkeleton />}
            {(feedStatus === "offline" || feedStatus === "error") && <KioskMessage kind={feedStatus} onRetry={retryFeed} />}
            {ready && seatCounts.available === 0 && <div className="mb-6"><KioskMessage kind="full" /></div>}
            {ready && <div className="min-h-0 space-y-6 overflow-y-auto">
              {floors.map((floor) => {
                const seats = seatViews.filter((s) => s.floorId === floor.id);
                if (!seats.length) return null;
                return (
                  <Card key={floor.id}>
                    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-line px-6 py-4">
                      <h2 className="text-lg font-semibold">{floor.name}</h2>
                      <ul className="flex flex-wrap gap-x-5 gap-y-1.5" aria-label="Seat status legend">
                        {LEGEND.map((l) => (
                          <li key={l.label} className="flex items-center gap-2 text-sm font-medium text-ink-soft"><span className={`h-3 w-3 rounded-full ${l.dot}`} aria-hidden="true" />{l.label}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid grid-cols-2 gap-5 p-6 sm:grid-cols-4">
                      {seats.map((seat) => (
                        <SeatTile key={seat.id} seat={seat} large disabled={seat.status !== "available"} onSelect={(s) => setSelectedId(s.id)} />
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>}
        </>
      </main>
      <footer className="shrink-0 px-6 pb-5 text-center text-sm text-muted">{library.name} · SmartLib</footer>

      {done && <KioskConfirmation reservation={done} onClose={() => setDone(null)} />}
      <KioskReserveModal key={selectedId} dev={dev} seatId={selectedId} onClose={() => setSelectedId(null)} onReserved={(reservation) => { setSelectedId(null); setDone(reservation); }} />
      {dev && <SimulationPanel />}
    </div>
  );
}
