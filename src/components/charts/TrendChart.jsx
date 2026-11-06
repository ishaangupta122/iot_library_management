"use client";

import { Area, CartesianGrid, Legend, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_PROPS, CHART_COLORS } from "@/components/charts/chartTheme";
import { ChartTooltip } from "@/components/charts/ChartTooltip";

/**
 * Percentage trend. `series`: [{ key, name, color, type: "area" | "line" }]
 * Pass more than one series to compare (e.g. today vs. typical).
 */
export function TrendChart({ data, xKey = "label", series, height = 260, yMax = 100, yTicks, axisUnit = "%", tooltipUnit = "%" }) {
  return (
    <div style={{ height }} role="img" aria-label={`Chart of ${series.map((s) => s.name).join(" and ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
          <defs>
            {series.filter((s) => s.type !== "line").map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey={xKey} {...AXIS_PROPS} minTickGap={24} />
          <YAxis {...AXIS_PROPS} domain={[0, yMax]} ticks={yTicks} allowDecimals={false} tickFormatter={(v) => `${v}${axisUnit}`} width={48} />
          <Tooltip content={<ChartTooltip unit={tooltipUnit} />} />
          {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) =>
            s.type === "line" ? (
              <Line isAnimationActive={false} key={s.key} dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} strokeDasharray="5 4" dot={false} type="monotone" connectNulls />
            ) : (
              <Area isAnimationActive={false} key={s.key} dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} fill={`url(#fill-${s.key})`} type="monotone" connectNulls />
            ),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
