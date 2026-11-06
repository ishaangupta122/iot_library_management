"use client";

import { useState } from "react";
import { FlaskConical, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLibrary } from "@/context/LibraryContext";
import { formatTime } from "@/lib/utils";

const TEST_STUDENTS = [
  { studentId: "STU-20901", studentName: "Test Student One" },
  { studentId: "STU-20902", studentName: "Test Student Two" },
  { studentId: "STU-20903", studentName: "Test Student Three" },
];
let studentCursor = 0;

/**
 * Development-only controls. They call the same context actions the real
 * sensors, kiosk and student site will use, so what you test here is what the
 * production flow will do. Hide with NEXT_PUBLIC_ENABLE_SIMULATION=false.
 */
export function SimulationPanel({ allowReservations = true }) {
  const { seatViews, now, setOccupancy, setDeviceConnectivity, createReservation, cancelReservation, advanceClock, heartbeatAll, resetData, notify, isLive, isOnline, setForcedOffline, reloadFeed, setForcedError } = useLibrary();
  const [open, setOpen] = useState(false);
  if (isLive || process.env.NEXT_PUBLIC_ENABLE_SIMULATION === "false") return null;

  const reserve = (seat) => {
    const student = TEST_STUDENTS[studentCursor++ % TEST_STUDENTS.length];
    const result = createReservation(seat.id, student, "kiosk");
    notify(result.ok ? `Reserved ${seat.number} for ${student.studentName}.` : result.error, result.ok ? "success" : "error");
  };

  return (
    <div className="fixed right-4 bottom-4 z-40 print:hidden">
      {open ? (
        <div role="dialog" aria-label="Development simulation" className="flex max-h-[80vh] w-[min(92vw,380px)] flex-col rounded-xl border border-line-strong bg-surface shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold"><FlaskConical size={16} aria-hidden="true" className="text-brand-600" /> Dev simulation</p>
              <p className="text-xs text-muted">Mock clock: {formatTime(now)}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close simulation panel" className="rounded-lg p-1.5 text-muted hover:bg-cream-200"><X size={16} aria-hidden="true" /></button>
          </div>
          <div className="space-y-3 overflow-y-auto p-4">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={isOnline ? "secondary" : "primary"} onClick={() => setForcedOffline(isOnline)}>
                {isOnline ? "Simulate offline" : "Bring back online"}
              </Button>
              <Button size="sm" onClick={reloadFeed}>Simulate loading</Button>
              <Button size="sm" onClick={() => setForcedError(true)}>Simulate error</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => advanceClock(1)}>+1 min</Button>
              <Button size="sm" onClick={() => advanceClock(3)}>+3 min</Button>
              <Button size="sm" onClick={() => advanceClock(10)}>+10 min</Button>
              <Button size="sm" onClick={() => { heartbeatAll(); notify("All active sensors sent a fresh heartbeat."); }}>Heartbeat all</Button>
            </div>
            <ul className="space-y-2">
              {seatViews.map((seat) => (
                <li key={seat.id} className="rounded-lg border border-line p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">{seat.number} <span className="font-normal text-muted">{seat.device?.id ?? "no sensor"}</span></span>
                    <StatusBadge status={seat.status} />
                  </div>
                  {seat.device ? (
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" onClick={() => setOccupancy(seat.id, !seat.occupied)}>{seat.occupied ? "Stand up" : "Sit down"}</Button>
                      <Button size="sm" onClick={() => setDeviceConnectivity(seat.device.id, "online")}>Online</Button>
                      <Button size="sm" onClick={() => setDeviceConnectivity(seat.device.id, "stale")}>Stale</Button>
                      <Button size="sm" onClick={() => setDeviceConnectivity(seat.device.id, "offline")}>Offline</Button>
                      {allowReservations && seat.status === "available" && <Button size="sm" onClick={() => reserve(seat)}>Reserve</Button>}
                      {allowReservations && seat.reservation && <Button size="sm" onClick={() => cancelReservation(seat.reservation.id)}>Cancel hold</Button>}
                    </div>
                  ) : (
                    <p className="text-xs text-muted">Assign a sensor to simulate this seat.</p>
                  )}
                </li>
              ))}
            </ul>
            <Button size="sm" variant="danger" onClick={() => { resetData(); notify("Mock data reset to its initial state."); }}><RotateCcw size={14} aria-hidden="true" /> Reset mock data</Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-pop hover:bg-cream-50">
          <FlaskConical size={16} aria-hidden="true" className="text-brand-600" /> Dev simulation
        </button>
      )}
    </div>
  );
}
