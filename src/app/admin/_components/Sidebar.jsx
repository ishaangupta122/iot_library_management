"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LibraryBig, LogOut, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLibrary } from "@/context/LibraryContext";
import { cn, initialsOf } from "@/lib/utils";

/** Tooltip shown beside an icon when the sidebar is collapsed (fixed so the scrolling nav cannot clip it). */
function RailTip({ label, show, children }) {
  const [pos, setPos] = useState(null);
  const open = (e) => setPos(e.currentTarget.getBoundingClientRect());
  const close = () => setPos(null);
  return (
    <div onMouseEnter={open} onMouseLeave={close} onFocus={open} onBlur={close}>
      {children}
      {show && pos && (
        <span
          role="tooltip"
          style={{ top: pos.top + pos.height / 2, left: pos.right + 10 }}
          className="pointer-events-none fixed z-[70] hidden -translate-y-1/2 rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-pop lg:block"
        >
          {label}
        </span>
      )}
    </div>
  );
}

export function Sidebar({ collapsed, mobileOpen, onClose, onToggleCollapse, onLogout }) {
  const pathname = usePathname();
  const { library } = useLibrary();
  const { user } = useAuth();
  // On phones the drawer is always full width; collapse only applies on lg+.
  const rail = collapsed;

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        aria-label="Primary"
        className={cn(
          "on-red fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-brand-800 bg-brand-700 text-white transition-[transform,width] duration-200 print:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          rail ? "lg:w-[72px]" : "lg:w-64",
        )}
      >
        <div className={cn("flex h-16 items-center gap-3 border-b border-white/10 px-4", rail && "lg:justify-center lg:px-0")}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-brand-700" title="SmartLib">
            <LibraryBig size={25} aria-hidden="true" />
          </span>
          <div className={cn("min-w-0 flex-1", rail && "lg:hidden")}>
            <p className="font-display text-xl leading-tight font-semibold tracking-tight text-white">SmartLib</p>
            <p className="text-[11px] leading-tight tracking-wide text-brand-200 uppercase">{library.name} Admin</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded-lg p-1.5 text-brand-100 hover:bg-white/10 lg:hidden">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <RailTip label={item.label} show={rail}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        rail && "lg:justify-center lg:px-0",
                        active ? "bg-surface text-brand-800 shadow-card" : "text-brand-100 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Icon size={18} aria-hidden="true" className="shrink-0" />
                      <span className={cn(rail && "lg:sr-only")}>{item.label}</span>
                    </Link>
                  </RailTip>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          <RailTip label="Expand sidebar" show={rail}>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
            className="mb-2 hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-200 hover:bg-white/10 hover:text-white lg:flex"
          >
            {rail ? <ChevronsRight size={18} aria-hidden="true" className="mx-auto" /> : <><ChevronsLeft size={18} aria-hidden="true" />Collapse</>}
          </button>
          </RailTip>
          <div className={cn("flex items-center gap-3 rounded-lg bg-white/10 p-2.5", rail && "lg:flex-col lg:bg-transparent lg:p-0")}>
            <RailTip label={`${user?.name} · Administrator`} show={rail}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-[13px] font-semibold text-brand-800">
                {initialsOf(user?.name ?? "A")}
              </span>
            </RailTip>
            <div className={cn("min-w-0 flex-1", rail && "lg:hidden")}>
              <p className="truncate text-[13px] font-semibold text-white">{user?.name}</p>
              <p className="truncate text-xs text-brand-200">Administrator</p>
            </div>
            <RailTip label="Log out" show={rail}>
              <button type="button" onClick={onLogout} aria-label="Log out" className="rounded-lg p-2 text-brand-100 hover:bg-white/15 hover:text-white">
                <LogOut size={17} aria-hidden="true" />
              </button>
            </RailTip>
          </div>
        </div>
      </aside>
    </>
  );
}
