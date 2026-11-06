import { Card } from "@/components/ui/Card";

/** Centered message for empty / offline / error states. */
export function MessageCard({ icon: Icon, title, text, action }) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <Icon size={26} aria-hidden="true" className="text-muted" />
      <p className="mt-3 font-display text-xl font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
