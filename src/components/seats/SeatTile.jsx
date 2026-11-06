import { WifiOff } from "lucide-react";
import { Chair } from "@/components/seats/Chair";
import { STATUS_META } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

// Same look as the student seat cards: 700-shade accents on a very light tint.
const CARD = {
  available: "border-ok-700/50 bg-ok-700/[0.05] hover:border-ok-700",
  occupied: "border-brand-700/50 bg-brand-700/[0.05] hover:border-brand-700",
  reserved: "border-warn-700/50 bg-warn-700/[0.05] hover:border-warn-700",
  unavailable: "border-dashed border-ink-soft/45 bg-ink-soft/[0.04] hover:border-ink-soft/70",
};
const TEXT = {
  available: "text-ok-700",
  occupied: "text-brand-700",
  reserved: "text-warn-700",
  unavailable: "text-ink-soft",
};

/** Square seat tile: small chair, seat number and status pill. */
export function SeatTile({ seat, selected, onSelect, large = false, disabled = false }) {
  const label = STATUS_META[seat.status].label;
  const offline = seat.sensor.state === "offline" || seat.sensor.state === "stale";
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(seat)}
      aria-disabled={disabled || undefined}
      aria-label={`Seat ${seat.number}, ${label}. ${seat.reason}`}
      className={cn(
        "seat-card relative flex aspect-square w-full flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition-colors",
        large ? "gap-4 rounded-2xl p-4" : "gap-3",
        CARD[seat.status],
        disabled && "cursor-not-allowed",
      )}
    >
      {offline && <WifiOff size={12} aria-label="Sensor offline" className="absolute top-2 right-2 text-muted" />}
      <Chair status={seat.status} size={large ? "lg" : "md"} />
      <span className="flex flex-col items-center gap-1">
        <span className={cn("leading-none font-semibold text-ink", large ? "text-2xl" : "text-base")}>{seat.number}</span>
        <span className={cn("leading-none font-semibold tracking-wide uppercase", large ? "text-sm" : "text-xs", TEXT[seat.status])}>{label}</span>
      </span>
    </button>
  );
}
