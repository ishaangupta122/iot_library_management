"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LibraryBig } from "lucide-react";
import { useLibrary } from "@/context/LibraryContext";

export function StudentShell({ children }) {
  const { library, setClockRunning } = useLibrary();

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
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <footer className="px-6 pt-12 pb-5 text-center text-sm text-muted">{library.name} · SmartLib</footer>
    </div>
  );
}
