import { cn } from "@/lib/utils";

const COLORS = {
  available: { back: "bg-ok-700", seat: "bg-ok-700/65", leg: "bg-ok-700" },
  occupied: { back: "bg-brand-700", seat: "bg-brand-700/65", leg: "bg-brand-700" },
  reserved: { back: "bg-warn-700", seat: "bg-warn-700/65", leg: "bg-warn-700" },
  unavailable: { back: "bg-ink-soft/80", seat: "bg-ink-soft/45", leg: "bg-ink-soft/80" },
};

const SIZES = {
  sm: { back: "h-6 w-10", seat: "h-4 w-11", legs: "w-8", leg: "h-1.5" },
  md: { back: "h-8 w-14", seat: "h-6 w-16", legs: "w-12", leg: "h-2" },
  lg: { back: "h-11 w-20", seat: "h-8 w-[5.5rem]", legs: "w-16", leg: "h-3" },
};

/** Little chair illustration coloured by seat status (decorative). */
export function Chair({ status, size = "md" }) {
  const c = COLORS[status];
  const s = SIZES[size];
  return (
    <div className="flex flex-col items-center saturate-150" aria-hidden="true">
      <div className={cn("rounded-xl", c.back, s.back)} />
      <div className={cn("-mt-1 rounded-lg", c.seat, s.seat)} />
      <div className={cn("flex justify-between", s.legs)}>
        <span className={cn("w-1.5 rounded-b", c.leg, s.leg)} />
        <span className={cn("w-1.5 rounded-b", c.leg, s.leg)} />
      </div>
    </div>
  );
}
