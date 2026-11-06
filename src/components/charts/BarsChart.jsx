"use client";

import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_PROPS, CHART_COLORS } from "@/components/charts/chartTheme";
import { ChartTooltip } from "@/components/charts/ChartTooltip";

/**
 * bars: [{ key, name, color }]. `stacked` stacks them. `highlight` colors the top bar differently.
 * `horizontal` draws category labels on the left (better for seat names).
 */
/** Track the chart's rendered width so axis labels can be thinned out only when they would collide. */
function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

const MIN_LABEL_WIDTH = 44; // px a label like "10am" needs to stay readable

export function BarsChart({ data, xKey = "label", bars, height = 260, unit = "", stacked = false, horizontal = false, yMax, highlightMax = false, highlightColor }) {
  const [wrapRef, width] = useWidth();
  const plotWidth = Math.max(0, width - 56);
  // Thin labels evenly, counting back from the last bar so the final one is always labelled.
  const step = plotWidth > 0 ? Math.max(1, Math.ceil(MIN_LABEL_WIDTH / (plotWidth / data.length))) : 1;
  const labelTicks = data.filter((_, i) => (data.length - 1 - i) % step === 0).map((d) => d[xKey]);
  const maxValue = highlightMax ? Math.max(...data.map((d) => d[bars[0].key])) : null;
  const tickFormatter = unit ? (v) => `${v}${unit}` : undefined;
  return (
    <div ref={wrapRef} style={{ height }} role="img" aria-label={`Bar chart of ${bars.map((b) => b.name).join(" and ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 12, bottom: 0, left: horizontal ? 0 : 4 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" {...AXIS_PROPS} domain={[0, yMax ?? "auto"]} tickFormatter={tickFormatter} />
              <YAxis type="category" dataKey={xKey} {...AXIS_PROPS} width={56} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...AXIS_PROPS} interval={0} ticks={labelTicks} />
              <YAxis {...AXIS_PROPS} domain={[0, yMax ?? "auto"]} tickFormatter={tickFormatter} width={44} allowDecimals={false} />
            </>
          )}
          <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: "rgba(187,60,55,0.08)" }} />
          {bars.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
          {bars.map((b, i) => (
            <Bar isAnimationActive={false} key={b.key} dataKey={b.key} name={b.name} fill={b.color} stackId={stacked ? "a" : undefined} radius={stacked ? (i === bars.length - 1 ? [4, 4, 0, 0] : 0) : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={36}>
              {highlightMax && data.map((d, idx) => <Cell key={idx} fill={d[b.key] === maxValue ? (highlightColor ?? CHART_COLORS.brandDark) : b.color} />)}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
