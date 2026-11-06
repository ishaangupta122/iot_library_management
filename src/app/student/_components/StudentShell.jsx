"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, LibraryBig } from "lucide-react";
import { SimulationPanel } from "@/components/SimulationPanel";
import { useLibrary } from "@/context/LibraryContext";
import { formatDate, formatTime, WEEKDAY_LONG, weekdayOf } from "@/lib/utils";

/** Actual current day, date and time (library time zone). Renders after mount to avoid a server/client mismatch. */
function RealClock() {
  const [ms, setMs] = useState(null);
  useEffect(() => {
    setMs(Date.now());
    const id = setInterval(() => setMs(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="flex min-w-24 items-center justify-end gap-2 text-sm font-medium whitespace-nowrap" aria-label="Current date and time">
      <Clock size={16} aria-hidden="true" className="hidden text-white/80 sm:block" />
      {ms !== null && (
        <>
          <span className="hidden sm:inline">{WEEKDAY_LONG[weekdayOf(ms)]}, {formatDate(ms)}</span>
          <span className="hidden text-white/50 sm:inline" aria-hidden="true">·</span>
          <span className="font-semibold tabular-nums">{formatTime(ms)}</span>
        </>
      )}
    </p>
  );
}

/** Public site chrome: red navbar, two pages, no login or profile. */
export function StudentShell({ children }) {
  const { library, setClockRunning } = useLibrary();

  // Keep the live clock running while the site is open so states update on their own.
  useEffect(() => {
    setClockRunning(true);
    return () => setClockRunning(false);
  }, [setClockRunning]);

  return (
    <div className="tight-corners flex min-h-screen flex-col">
      <header className="on-red sticky top-0 z-20 border-b border-brand-800 bg-brand-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/student" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-brand-700"><LibraryBig size={25} aria-hidden="true" /></span>
            <span>
              <span className="block font-display text-xl leading-tight font-semibold tracking-tight">SmartLib</span>
              <span className="hidden text-[11px] leading-tight tracking-wide text-white/85 uppercase sm:block">{library.name}</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <RealClock />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <footer className="px-6 pt-12 pb-5 text-center text-sm text-muted">{library.name} · SmartLib</footer>
      <SimulationPanel allowReservations={false} />
    </div>
  );
}
