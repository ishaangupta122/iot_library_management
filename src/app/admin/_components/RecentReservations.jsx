import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarClock } from "lucide-react";
import { formatTime, relativeTime } from "@/lib/utils";

export function RecentReservations({ reservations, now }) {
  return (
    <Card>
      <CardHeader title="Recent reservations" description="Temporary holds, newest first." action={<Link href="/admin/reservations" className="text-[13px] font-medium text-brand-700 hover:underline">View all</Link>} />
      {reservations.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No reservations yet" />
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {reservations.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">Seat {r.seat?.number} · {r.studentName}</p>
                <p className="text-xs text-muted">{r.id} · {formatTime(r.createdAt)} · {relativeTime(r.createdAt, now)}</p>
              </div>
              <StatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
