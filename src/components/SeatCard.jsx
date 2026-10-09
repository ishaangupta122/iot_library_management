/** Available = green, Occupied = red. No other states. */
const SEAT_STYLES = {
  available: {
    container: "bg-emerald-50 border-emerald-400 hover:scale-105 hover:shadow-lg hover:border-emerald-500",
    back:      "fill-emerald-500",
    cushion:   "fill-emerald-300",
    legs:      "fill-emerald-600",
    badge_bg:  "bg-emerald-100",
    text:      "text-emerald-700",
    label:     "Available",
  },
  occupied: {
    container: "bg-red-50 border-red-400",
    back:      "fill-red-500",
    cushion:   "fill-red-300",
    legs:      "fill-red-600",
    badge_bg:  "bg-red-100",
    text:      "text-red-700",
    label:     "Occupied",
  },
};

function ChairIcon({ status }) {
  const s = SEAT_STYLES[status];
  return (
    <svg width="52" height="52" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="8"  y="6"  width="40" height="22" rx="6" className={s.back}    />
      <rect x="6"  y="28" width="44" height="16" rx="5" className={s.cushion} />
      <rect x="10" y="44" width="6"  height="8"  rx="2" className={s.legs}    />
      <rect x="40" y="44" width="6"  height="8"  rx="2" className={s.legs}    />
    </svg>
  );
}

export default function SeatCard({ seat }) {
  const s = SEAT_STYLES[seat.status] ?? SEAT_STYLES.occupied;

  return (
    <div
      className={`
        flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2
        transition-all duration-200 cursor-default select-none w-24
        ${s.container}
      `}
    >
      <ChairIcon status={seat.status} />
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-bold text-gray-800 tracking-wide">{seat.label}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge_bg} ${s.text}`}>
          {s.label}
        </span>
      </div>
    </div>
  );
}
