"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bell, CalendarCheck, CalendarClock, CalendarX } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { useLibrary } from "@/context/LibraryContext";
import { cn, relativeTime } from "@/lib/utils";
import { usePersistentState } from "@/lib/usePersistentState";
import { CONFIG } from "@/config";

const MAX_ITEMS = 30;
const WINDOW_DAYS = CONFIG.history.notificationDays;
const WINDOW_MS = WINDOW_DAYS * 86_400_000;

function reservationEvents(reservations, nowMs) {
  const events = [];
  const seat = (r) => (r.seat ? `Seat ${r.seat.number}` : "a seat");
  const who = (r) => r.studentName || "A student";
  for (const r of reservations) {
    events.push({ id: `${r.id}:new`, kind: "new", at: r.createdAt, title: "New reservation", body: `${who(r)} reserved ${seat(r)} at the kiosk for ${r.durationMinutes} min.` });
    if (r.status === "completed") events.push({ id: `${r.id}:in`, kind: "in", at: r.closedAt ?? r.createdAt, title: "Checked in", body: `${who(r)} arrived at ${seat(r)}.` });
    if (r.status === "expired") events.push({ id: `${r.id}:exp`, kind: "exp", at: r.closedAt ?? r.expiresAt, title: "Reservation expired", body: `${who(r)} didn't arrive at ${seat(r)} in time. The seat is free again.` });
    if (r.status === "cancelled") events.push({ id: `${r.id}:cxl`, kind: "cxl", at: r.closedAt ?? r.createdAt, title: "Reservation cancelled", body: `The hold on ${seat(r)} for ${who(r)} was cancelled.` });
  }
  return events
    .filter((e) => e.at && Date.parse(e.at) <= nowMs && nowMs - Date.parse(e.at) <= WINDOW_MS)
    .sort((x, y) => y.at.localeCompare(x.at))
    .slice(0, MAX_ITEMS);
}

const KIND_ICON = { new: CalendarClock, in: CalendarCheck, exp: CalendarX, cxl: CalendarX };

export function NotificationsMenu() {
  const { reservationViews, now, nowMs } = useLibrary();
  const [lastReadAt, setLastReadAt] = usePersistentState("notifications:lastReadAt", "", (v) => typeof v === "string");
  const sorted = useMemo(() => reservationEvents(reservationViews, nowMs), [reservationViews, nowMs]);
  const isUnread = (e) => e.at > lastReadAt;
  const unread = sorted.filter(isUnread).length;
  const markNotificationsRead = () => setLastReadAt(new Date(nowMs).toISOString());

  return (
    <Popover
      label="Notifications"
      width="w-96"
      trigger={({ toggle, props }) => (
        <button type="button" onClick={toggle} {...props} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-line-strong bg-cream-100 text-ink-soft hover:bg-cream-200">
          <Bell size={18} aria-hidden="true" />
          {unread > 0 && <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">{unread > 9 ? "9+" : unread}</span>}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Reservation activity</p>
            <button type="button" onClick={markNotificationsRead} disabled={unread === 0} className="text-xs font-medium text-brand-700 hover:underline disabled:text-muted disabled:no-underline">
              Mark all as read
            </button>
          </div>
          {sorted.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No reservations in the last {WINDOW_DAYS} days.</p>}
          <ul className="max-h-96 divide-y divide-line overflow-y-auto">
            {sorted.map((n) => {
              const Icon = KIND_ICON[n.kind];
              const unreadItem = isUnread(n);
              return (
                <li key={n.id}>
                  <Link href="/admin/reservations" onClick={close} className={cn("flex gap-3 px-4 py-3 hover:bg-cream-50", unreadItem && "bg-brand-50/50")}>
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream-200 text-ink-soft">
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                        {n.title}
                        {unreadItem && <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted">{n.body}</span>
                      <span className="mt-1 block text-[11px] text-muted">{relativeTime(n.at, now)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Popover>
  );
}
