"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLibrary } from "@/context/LibraryContext";
import { cn, compareValues } from "@/lib/utils";

/**
 * Generic sortable, paginated table.
 * columns: [{ key, header, render?(row), sortValue?(row), sortable?, align?, className? }]
 */
export function DataTable({ columns, rows, rowKey = "id", onRowClick, initialSort, pageSize, caption, empty }) {
  const { settings } = useLibrary();
  const size = pageSize ?? settings.preferences.rowsPerPage;
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const get = col.sortValue ?? ((r) => r[col.key]);
    return [...rows].sort((a, b) => compareValues(get(a), get(b)) * (sort.dir === "asc" ? 1 : -1));
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / size));
  const current = Math.min(page, pageCount);
  const visible = sorted.slice((current - 1) * size, current * size);
  const from = sorted.length === 0 ? 0 : (current - 1) * size + 1;

  const toggleSort = (key) => {
    setPage(1);
    setSort((s) => (s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));
  };

  if (rows.length === 0) {
    return empty ?? <EmptyState icon={SearchX} title="No results" description="Try adjusting your search or filters." />;
  }

  return (
    <div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-y border-line bg-cream-50 text-xs font-semibold tracking-wide text-muted uppercase">
              {columns.map((col) => {
                const active = sort?.key === col.key;
                const SortIcon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={cn("px-4 py-2.5 whitespace-nowrap", col.align === "right" && "text-right", col.className)}
                  >
                    {col.sortable ? (
                      <button type="button" onClick={() => toggleSort(col.key)} className={cn("inline-flex items-center gap-1 uppercase hover:text-ink", active && "text-ink")}>
                        {col.header}
                        <SortIcon size={12} aria-hidden="true" />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("transition-colors", onRowClick && "cursor-pointer hover:bg-cream-50")}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 align-middle", col.align === "right" && "text-right", col.className)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-muted">
        <p>
          Showing {from}–{Math.min(current * size, sorted.length)} of {sorted.length}
        </p>
        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Previous page" className="rounded-lg border border-line-strong p-1.5 hover:bg-cream-100 disabled:opacity-40">
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <span className="px-2">
              Page {current} of {pageCount}
            </span>
            <button type="button" onClick={() => setPage(current + 1)} disabled={current === pageCount} aria-label="Next page" className="rounded-lg border border-line-strong p-1.5 hover:bg-cream-100 disabled:opacity-40">
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
