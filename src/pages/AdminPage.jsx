import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Armchair,
  Clock,
  TrendingUp,
  Users,
  BarChart2,
  Activity,
  PieChart as PieIcon,
  // Timer, // used only in commented-out section
} from "lucide-react";
import {
  PEAK_HOURS,
  WEEKLY_OCCUPANCY,
  OCCUPANCY_BREAKDOWN,
  // ZONE_STATS, // used only in commented-out section
  KPI_CARDS,
} from "../data/analytics";

// ─── KPI card ────────────────────────────────────────────────────────────────
const KPI_META = [
  { icon: Armchair, icon_bg: "bg-blue-100", icon_color: "text-blue-600" },
  { icon: Users, icon_bg: "bg-red-100", icon_color: "text-red-500" },
  { icon: Clock, icon_bg: "bg-indigo-100", icon_color: "text-indigo-600" },
  { icon: TrendingUp, icon_bg: "bg-amber-100", icon_color: "text-amber-600" },
];

function KpiCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
  icon_bg,
  icon_color,
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${icon_bg}`}>
          <Icon size={15} className={icon_color} strokeWidth={2} />
        </div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────
function ChartCard({
  title,
  sub,
  icon: Icon,
  icon_bg = "bg-blue-100",
  icon_color = "text-blue-600",
  children,
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-1">
        {Icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${icon_bg}`}>
            <Icon size={15} className={icon_color} strokeWidth={2} />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

// ─── Custom tooltip shared by bar / area charts ───────────────────────────────
function ChartTooltip({ active, payload, label, unit = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold mb-0.5">{label}</p>
      <p>
        {payload[0].value}
        {unit}
      </p>
    </div>
  );
}

// ─── Avg seating time rows ────────────────────────────────────────────────────
// function ZoneRow({ zone, avgTime, sessions, maxSessions }) {
//   const pct = Math.round((sessions / maxSessions) * 100);
//   return (
//     <div>
//       <div className="flex justify-between mb-1.5">
//         <span className="text-xs font-semibold text-gray-700">{zone}</span>
//         <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
//           {avgTime}
//         </span>
//       </div>
//       <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
//         <div
//           className="h-full rounded-full bg-blue-500 transition-all duration-500"
//           style={{ width: `${pct}%` }}
//         />
//       </div>
//       <p className="text-[10px] text-gray-400 mt-1">
//         {sessions} sessions today
//       </p>
//     </div>
//   );
// }

// ─── Admin page ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Page header — gradient banner matching WelcomeBanner */}
      <div className="relative overflow-hidden bg-linear-to-r from-indigo-600 to-blue-500 rounded-2xl shadow-sm px-8 py-7">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 right-20 w-28 h-28 bg-white/5 rounded-full" />
        <h1 className="relative text-2xl font-bold text-white">
          Admin Dashboard
        </h1>
        <p className="relative text-sm text-indigo-200 mt-0.5">
          Library seat analytics — today
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} {...KPI_META[i]} />
        ))}
      </div>

      {/* Weekly Occupancy — full width line/area chart */}
      <ChartCard
        title="Weekly Occupancy"
        sub="Avg. % seats occupied per day"
        icon={Activity}
        icon_bg="bg-emerald-100"
        icon_color="text-emerald-600">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={WEEKLY_OCCUPANCY}
            margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f3f4f6"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              unit="%"
            />
            <Tooltip content={<ChartTooltip unit="%" />} />
            <Area
              type="monotone"
              dataKey="pct"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#areaGrad)"
              dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#059669" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Peak Hours (bar) + Current Occupancy (pie) — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard
          title="Peak Hours"
          sub="Avg. student count by hour"
          icon={BarChart2}
          icon_bg="bg-blue-100"
          icon_color="text-blue-600">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={PEAK_HOURS}
              barCategoryGap="30%"
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "#f9fafb" }}
              />
              <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Current Occupancy"
          sub="Seats available vs occupied right now"
          icon={PieIcon}
          icon_bg="bg-purple-100"
          icon_color="text-purple-600">
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={OCCUPANCY_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={52}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={3}>
                  {OCCUPANCY_BREAKDOWN.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                        <p className="font-semibold">{payload[0].name}</p>
                        <p>{payload[0].value} seats</p>
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              {OCCUPANCY_BREAKDOWN.map((seg) => (
                <div key={seg.name} className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.fill }}
                  />
                  <span className="text-xs font-medium text-gray-600">
                    {seg.name}
                  </span>
                  <span
                    className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: seg.fill + "22",
                      color: seg.fill,
                    }}>
                    {seg.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ─── Avg. Seating Time by Zone (commented out) ─────────────────────────── */}
      {/* <ChartCard
          title="Avg. Seating Time by Zone"
          sub="Based on today's sessions"
          icon={Timer}
          icon_bg="bg-indigo-100"
          icon_color="text-indigo-600">
          <div className="space-y-4">
            {ZONE_STATS.map((z) => (
              <ZoneRow key={z.zone} {...z} />
            ))}
          </div>
        </ChartCard> */}
    </main>
  );
}
