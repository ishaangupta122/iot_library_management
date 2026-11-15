"use client";

import { useState } from "react";
import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BarcodeScanner } from "./BarcodeScanner";
import { useLibrary } from "@/context/LibraryContext";
import { CONFIG } from "@/config";
import { formatDuration } from "@/lib/utils";

export function KioskReserveModal({ seatId, onClose, onReserved }) {
  const { seatById, reserveWithCard } = useLibrary();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [roll, setRoll] = useState("");
  const seat = seatId ? seatById.get(seatId) : null;
  if (!seat) return null;

  const hold = formatDuration(CONFIG.reservation.holdMinutes);
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
            {busy ? (
              <p className="rounded-xl bg-cream-100 px-6 py-16 text-center text-lg font-semibold text-ink-soft">Checking your card…</p>
            ) : typing ? (
              <form
                className="rounded-xl bg-cream-100 px-6 py-8"
                onSubmit={(e) => { e.preventDefault(); if (roll.trim()) handleCardTap(roll); }}
              >
                <label htmlFor="roll" className="mb-2 block text-center text-sm font-medium text-ink-soft">Roll number (as printed on your ID card)</label>
                <div className="mx-auto flex max-w-sm gap-2">
                  <input id="roll" autoFocus inputMode="numeric" autoComplete="off" value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="e.g. 1024031118" className="h-12 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-3 text-lg tabular-nums" />
                  <Button type="submit" variant="primary" className="h-12" disabled={!roll.trim()}>Reserve seat</Button>
                </div>
              </form>
            ) : (
              <BarcodeScanner onScan={handleCardTap} />
            )}
            {!busy && (
              <>
                <p className="mt-3 text-center font-display text-xl font-medium">{typing ? "Type your roll number" : "Show your ID card barcode to the camera"}</p>
                <p className="mt-2 text-center">
                  <button type="button" onClick={() => { setTyping((t) => !t); setRoll(""); }} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 underline-offset-4 hover:underline">
                    <Keyboard size={15} aria-hidden="true" />
                    {typing ? "Scan my card instead" : "No card? Type your roll number"}
                  </button>
                </p>
              </>
            )}
          </div>
        </>
      )}

    </Modal>
  );
}
