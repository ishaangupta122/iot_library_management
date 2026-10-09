import { Armchair, Users, CheckCircle2, Percent } from "lucide-react";

const STAT_CONFIG = [
  {
    key: "total",
    label: "Total Seats",
    sub: "in this zone",
    icon: Armchair,
    value_color: "text-gray-900",
    icon_bg: "bg-blue-100",
    icon_color: "text-blue-600",
  },
  {
    key: "occupied",
    label: "Occupied",
    sub: "currently in use",
    icon: Users,
    value_color: "text-red-600",
    icon_bg: "bg-red-100",
    icon_color: "text-red-500",
  },
  {
    key: "available",
    label: "Available",
    sub: "ready to use",
    icon: CheckCircle2,
    value_color: "text-emerald-600",
    icon_bg: "bg-emerald-100",
    icon_color: "text-emerald-600",
  },
  {
    key: "occupancy",
    label: "Occupancy Rate",
    sub: "of seats filled",
    icon: Percent,
    value_color: "text-amber-600",
    icon_bg: "bg-amber-100",
    icon_color: "text-amber-600",
  },
];

export default function StatsCards({ seats }) {
  const total     = seats.length;
  const occupied  = seats.filter((s) => s.status === "occupied").length;
  const available = total - occupied;
  const occupancy = total > 0 ? `${Math.round((occupied / total) * 100)}%` : "0%";

  const values = { total, occupied, available, occupancy };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STAT_CONFIG.map(({ key, label, sub, icon: Icon, value_color, icon_bg, icon_color }) => (
        <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${icon_bg}`}>
              <Icon size={15} className={icon_color} strokeWidth={2} />
            </div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
          </div>
          <p className={`text-3xl font-bold tracking-tight ${value_color}`}>{values[key]}</p>
          <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
        </div>
      ))}
    </div>
  );
}
