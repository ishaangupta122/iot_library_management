import { AlertCircle, Armchair, Ban, CheckCircle2, Clock, Hourglass, MinusCircle, Wifi, WifiOff, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  ok: "bg-ok-50 text-ok-700 border-ok-100",
  warn: "bg-warn-50 text-warn-700 border-warn-100",
  danger: "bg-brand-50 text-brand-700 border-brand-100",
  neutral: "bg-cream-200 text-ink-soft border-line",
  brand: "bg-brand-600 text-white border-brand-600",
};

/** One vocabulary for seat, reservation and device statuses (icon + text, never color alone). */
export const STATUS_META = {
  // seats
  available: { label: "Available", tone: "ok", icon: CheckCircle2 },
  occupied: { label: "Occupied", tone: "danger", icon: Armchair },
  reserved: { label: "Reserved", tone: "warn", icon: Clock },
  unavailable: { label: "Unavailable", tone: "neutral", icon: Ban },
  // reservations
  active: { label: "Active", tone: "warn", icon: Hourglass },
  completed: { label: "Completed", tone: "ok", icon: CheckCircle2 },
  expired: { label: "Expired", tone: "danger", icon: MinusCircle },
  cancelled: { label: "Cancelled", tone: "danger", icon: XCircle },
  // devices
  online: { label: "Online", tone: "ok", icon: Wifi },
  offline: { label: "Offline", tone: "danger", icon: WifiOff },
  inactive: { label: "Inactive", tone: "neutral", icon: Ban },
  // sessions
  "in-progress": { label: "In progress", tone: "danger", icon: Armchair },
};

// Solid, dark fills with white text for status tags.
const SOLID = {
  ok: "bg-ok-700 text-white",
  warn: "bg-warn-700 text-white",
  danger: "bg-brand-700 text-white",
  neutral: "bg-ink-soft text-white",
};

export function StatusBadge({ status, label, className }) {
  const meta = STATUS_META[status] ?? { label: status, tone: "neutral", icon: AlertCircle };
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold", SOLID[meta.tone], className)}>
      <Icon size={14} aria-hidden="true" />
      {label ?? meta.label}
    </span>
  );
}

export function Pill({ tone = "neutral", children, className }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", TONES[tone], className)}>{children}</span>;
}
