"use client";

import Link from "next/link";
import { AlertTriangle, Bell, CalendarClock, Cpu, Info } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { useLibrary } from "@/context/LibraryContext";
import { cn, relativeTime } from "@/lib/utils";

const TYPE_ICON = { device: Cpu, reservation: CalendarClock, system: Info, alert: AlertTriangle };

export function NotificationsMenu() {
  const { notifications, now, markNotificationsRead } = useLibrary();
  const unread = notifications.filter((n) => !n.read).length;
  const sorted = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Popover
      label="Notifications"
      width="w-96"
      trigger={({ toggle, props }) => (
        <button type="button" onClick={toggle} {...props} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-line-strong bg-cream-100 text-ink-soft hover:bg-cream-200">
          <Bell size={18} aria-hidden="true" />
          {unread > 0 && <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">{unread}</span>}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <button type="button" onClick={markNotificationsRead} disabled={unread === 0} className="text-xs font-medium text-brand-700 hover:underline disabled:text-muted disabled:no-underline">
              Mark all as read
            </button>
          </div>
          <ul className="max-h-96 divide-y divide-line overflow-y-auto">
            {sorted.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Info;
              return (
                <li key={n.id}>
                  <Link href={n.href} onClick={close} className={cn("flex gap-3 px-4 py-3 hover:bg-cream-50", !n.read && "bg-brand-50/50")}>
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream-200 text-ink-soft">
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                        {n.title}
                        {!n.read && <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted">{n.body}</span>
                      <span className="mt-1 block text-[11px] text-muted">{relativeTime(n.createdAt, now)}</span>
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
