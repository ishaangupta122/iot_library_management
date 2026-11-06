"use client";

import { Armchair, Ban, CheckCircle2, Clock, Info } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { STATUS_META } from "@/components/ui/StatusBadge";
import { useLibrary } from "@/context/LibraryContext";
import { cn, formatTime, relativeTime } from "@/lib/utils";

const ICONS = { available: CheckCircle2, occupied: Armchair, reserved: Clock, unavailable: Ban };
const THEME = {
  available: { panel: "border-ok-500/30 bg-gradient-to-br from-ok-50 to-surface", pill: "bg-ok-700 text-white", text: "Empty and free to sit." },
  occupied: { panel: "border-brand-500/30 bg-gradient-to-br from-brand-50 to-surface", pill: "bg-brand-700 text-white", text: "Someone is sitting here." },
  reserved: { panel: "border-warn-500/30 bg-gradient-to-br from-warn-50 to-surface", pill: "bg-warn-700 text-white", text: "Empty, but held for someone arriving shortly." },
  unavailable: { panel: "border-line-strong bg-gradient-to-br from-cream-200 to-surface", pill: "bg-ink-soft text-white", text: "Status can't be confirmed right now." },
};
const SENSOR = {
  fresh: { text: "Working", dot: "bg-ok-500" },
  stale: { text: "Not sending data", dot: "bg-warn-500" },
  offline: { text: "Offline", dot: "bg-brand-600" },
  inactive: { text: "Not active", dot: "bg-muted/60" },
  none: { text: "No sensor", dot: "bg-muted/60" },
};

function Row({ label, children }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 py-2">
      <dt className="text-[15px] text-muted">{label}</dt>
      <dd className="text-right text-[15px] font-medium text-ink">{children}</dd>
    </div>
  );
}

/** Read-only seat information. Public view hides people and device IDs; `admin` adds them and drops the kiosk note. */
export function SeatDetails({ seatId, onClose, admin = false }) {
  const { seatById, now, nowMs } = useLibrary();
  const seat = seatId ? seatById.get(seatId) : null;
  if (!seat) return null;

  const theme = THEME[seat.status];
  const Icon = ICONS[seat.status];
  const sensor = SENSOR[seat.sensor.state];
  const minutesLeft = seat.reservation ? Math.max(0, Math.ceil((Date.parse(seat.reservation.expiresAt) - nowMs) / 60000)) : null;

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Seat ${seat.number}`}
      description={seat.floor?.name}
      badge={<span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", theme.pill)}><Icon size={14} aria-hidden="true" />{STATUS_META[seat.status].label}</span>}
    >
      <p className="text-lg leading-snug font-semibold text-ink">{theme.text}</p>

      <dl className="mt-4 divide-y divide-line">
        <Row label="Sensor"><span className="inline-flex items-center gap-2"><span className={cn("h-2.5 w-2.5 rounded-full", sensor.dot)} aria-hidden="true" />{admin && seat.device ? `${seat.device.id} · ${sensor.text}` : sensor.text}</span></Row>
        <Row label="Last updated">{seat.device?.lastSeenAt ? relativeTime(seat.device.lastSeenAt, now) : "—"}</Row>
        {admin && seat.reservation && <Row label="Held by">{seat.reservation.studentName}</Row>}
        {seat.reservation && (
          <Row label="Held until">
            <span className="inline-flex flex-wrap items-center justify-end gap-2.5">
              {formatTime(seat.reservation.expiresAt)}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-100 px-2.5 py-0.5 text-xs font-semibold text-warn-700"><Clock size={13} aria-hidden="true" />{minutesLeft} min left</span>
            </span>
          </Row>
        )}
      </dl>

      {!admin && (
        <p className="mt-7 flex items-center gap-2.5 rounded-xl border border-warn-100 bg-warn-50 px-4 py-3 text-[13px] leading-snug font-medium text-warn-700">
          <Info size={16} aria-hidden="true" className="shrink-0" />
          Seats can only be reserved at the library kiosk.
        </p>
      )}
    </Modal>
  );
}
