import { AlertTriangle, Armchair, DoorClosed, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const Bar = ({ className }) => <div className={`animate-pulse rounded-md bg-cream-300 ${className}`} />;

export function KioskSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading seats">
      <Card>
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <Bar className="h-6 w-36" />
          <Bar className="hidden h-4 w-80 sm:block" />
        </div>
        <div className="grid grid-cols-2 gap-5 p-6 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border-2 border-line p-2">
              <Bar className="h-12 w-14" />
              <Bar className="h-4 w-16" />
              <Bar className="h-3 w-20" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const MESSAGES = {
  offline: { icon: WifiOff, title: "Reservations are paused", text: "This kiosk can't reach the library system.", note: "Please ask the library desk for help." },
  error: { icon: AlertTriangle, title: "Something went wrong", text: "We couldn't load the seats.", note: "Please try again." },
  full: { icon: Armchair, title: "All seats are taken right now", text: "Please check back in a few minutes.", note: "This screen updates by itself." },
  closed: { icon: DoorClosed, title: "The library is closed", text: "Reservations open when the library opens.", note: "Reservations are paused until then." },
};

export function KioskMessage({ kind, onRetry, text: customText, note: customNote }) {
  const { icon: Icon, title, text: defaultText, note: defaultNote } = MESSAGES[kind];
  const note = customNote ?? defaultNote;
  const text = customText ?? defaultText;
  return (
    <Card className={`flex flex-col items-center px-8 text-center ${kind === "full" ? "py-8" : "py-16"}`} role={kind === "full" ? "status" : "alert"}>
      <Icon size={kind === "full" ? 36 : 48} aria-hidden="true" className="text-muted" />
      <p className="mt-4 font-display text-3xl font-medium">{title}</p>
      <p className="mt-3 text-xl font-medium text-ink">{text}</p>
      {note && <p className="mt-1 text-base text-muted">{note}</p>}
      {kind === "error" && onRetry && <Button size="lg" variant="primary" className="mt-7" onClick={onRetry}>Try again</Button>}
    </Card>
  );
}
