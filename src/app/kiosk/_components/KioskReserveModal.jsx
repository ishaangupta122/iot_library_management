"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BarcodeScanner } from "./BarcodeScanner";
import { useLibrary } from "@/context/LibraryContext";
import { formatDuration } from "@/lib/utils";

/**
 * Confirms a reservation for the tapped seat. The student identifies by scanning the Code 128
 * barcode (their roll number) on their ID card with the camera: no typing. `handleCardTap` looks
 * the scanned roll number up (on the server when live); the dev box below simulates a scan.
 */
export function KioskReserveModal({ seatId, onClose, onReserved, dev = false }) {
  const { seatById, students, settings, reserveWithCard, isLive } = useLibrary();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [devStudentId, setDevStudentId] = useState(students[0]?.id);
  const seat = seatId ? seatById.get(seatId) : null;
  if (!seat) return null;

  const hold = formatDuration(settings.reservation.durationMinutes);
  const stillFree = seat.status === "available";

  const handleCardTap = async (scanned) => {
    setBusy(true);
    const result = await reserveWithCard(seat.id, scanned);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onReserved(result.reservation);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={`Seat ${seat.number}`}
      description={seat.floor?.name}
      badge={<StatusBadge status={seat.status} />}
    >
      {!stillFree ? (
        <p className="text-lg font-semibold text-ink">This seat is no longer available. Please choose another.</p>
      ) : error ? (
        <div role="alert">
          <p className="text-lg font-semibold text-brand-700">{error}</p>
          <Button className="mt-5" onClick={() => setError("")}>Try again</Button>
        </div>
      ) : (
        <>
          <p className="text-lg font-semibold text-ink">Reserve this seat for {hold}?</p>
          <p className="mt-1 text-[15px] text-muted">Sit down before the time runs out, or the seat is released.</p>
          <div className="mt-5">
            {busy ? <p className="rounded-xl bg-cream-100 px-6 py-16 text-center text-lg font-semibold text-ink-soft">Checking your card…</p> : <BarcodeScanner onScan={handleCardTap} />}
            <p className="mt-3 text-center font-display text-xl font-medium">Show your ID card barcode to the camera</p>
          </div>
        </>
      )}

      {dev && !isLive && stillFree && !error && (
        <div className="mt-5 rounded-lg border border-dashed border-line-strong p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase"><FlaskConical size={13} aria-hidden="true" /> Dev: simulate a scan</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="dev-card">Student card</label>
            <select id="dev-card" value={devStudentId} onChange={(e) => setDevStudentId(e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-2.5 text-sm">
              {students.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.id}</option>)}
            </select>
            <Button size="sm" onClick={() => handleCardTap(devStudentId)}>Tap card</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
