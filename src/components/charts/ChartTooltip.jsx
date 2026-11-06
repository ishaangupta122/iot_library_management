export function ChartTooltip({ active, payload, label, unit = "", formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={p.dataKey} className="flex items-center justify-between gap-4 text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} aria-hidden="true" />
              {p.name}
            </span>
            <span className="font-semibold text-ink">{formatter ? formatter(p.value, p) : `${p.value}${unit}`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
