"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Armchair, CalendarClock, FileText, Search } from "lucide-react";
import { useLibrary } from "@/context/LibraryContext";
import { NAV_ITEMS } from "@/lib/navigation";

/** Searches pages, seats, reservations and devices from the shared data. */
export function GlobalSearch() {
  const router = useRouter();
  const { seatViews, reservationViews } = useLibrary();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const match = (...fields) => fields.some((f) => f?.toLowerCase().includes(q));
    return [
      ...NAV_ITEMS.filter((n) => match(n.label, n.description)).map((n) => ({ key: n.href, label: n.label, meta: "Page", href: n.href, icon: FileText })),
      ...seatViews.filter((s) => match(s.number, s.id, s.section?.name)).map((s) => ({ key: s.id, label: `Seat ${s.number}`, meta: `${s.floor?.name} · ${s.status}`, href: "/admin/monitoring", icon: Armchair })),
      ...reservationViews.filter((r) => match(r.id, r.studentName, r.studentId)).slice(0, 4).map((r) => ({ key: r.id, label: r.id, meta: `${r.studentName} · seat ${r.seat?.number}`, href: "/admin/reservations", icon: CalendarClock })),
    ].slice(0, 8);
  }, [query, seatViews, reservationViews]);

  const go = (href) => {
    setQuery("");
    setFocused(false);
    router.push(href);
  };

  return (
    <div className="group relative w-full" onFocus={() => { clearTimeout(blurTimer.current); setFocused(true); }} onBlur={() => { blurTimer.current = setTimeout(() => setFocused(false), 120); }}>
      <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && results[0]) go(results[0].href); if (e.key === "Escape") setFocused(false); }}
        placeholder="Search seats and reservations…"
        aria-label="Global search"
        className="h-10 w-full rounded-lg border border-line-strong bg-cream-100 pr-3 pl-9 text-sm text-ink placeholder:text-muted"
      />
      {focused && query.trim() && (
        <ul className="reset-focus absolute top-full z-40 text-ink mt-2 w-full overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop">
          {results.length === 0 && <li className="px-4 py-3 text-sm text-muted">No matches for “{query}”.</li>}
          {results.map((r) => (
            <li key={r.key + r.meta}>
              <button type="button" onClick={() => go(r.href)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-cream-100">
                <r.icon size={16} aria-hidden="true" className="shrink-0 text-muted" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{r.label}</span>
                  <span className="block truncate text-xs text-muted capitalize">{r.meta}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
