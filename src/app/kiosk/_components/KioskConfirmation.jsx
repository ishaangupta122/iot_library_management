"use client";

import { CheckCircle2, Clock, X } from "lucide-react";
import { useLibrary } from "@/context/LibraryContext";
import { formatDuration, formatTime } from "@/lib/utils";

export const CONFIRMATION_MS = 4000;

/** Brief "you're set" message shown over the layout, then it clears itself so the next student can go. */
export function KioskConfirmation({ reservation: r, onClose }) {
  const { seatById } = useLibrary();
  if (!r) return null;
  const seat = seatById.get(r.seatId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="status" aria-live="polite" onClick={onClose}>
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-surface text-center shadow-pop" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Close message" className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600 text-white shadow-card hover:bg-brand-700">
          <X size={22} aria-hidden="true" />
        </button>
        <div className="px-8 pt-10 pb-8">
          <CheckCircle2 size={56} aria-hidden="true" className="mx-auto text-ok-700" />
          <h2 className="mt-5 font-display text-3xl font-medium">Seat {seat?.number} is yours</h2>
          <p className="mt-2 text-lg text-ink-soft">{r.studentName.split(" ")[0]}, please sit down within {formatDuration(r.durationMinutes)}.</p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-warn-700/10 px-4 py-2 text-base font-semibold whitespace-nowrap text-warn-700">
            <Clock size={17} aria-hidden="true" />
            Held until {formatTime(r.expiresAt)}
          </p>
        </div>
        <div className="h-1.5 bg-cream-200" aria-hidden="true">
          <div className="h-full origin-left bg-ok-700" style={{ animation: `shrink ${CONFIRMATION_MS}ms linear forwards` }} />
        </div>
      </div>
    </div>
  );
}
