"use client";

import { AlertTriangle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MessageCard } from "@/components/ui/MessageCard";
import { useLibrary } from "@/context/LibraryContext";

const Bar = ({ className }) => <div className={`animate-pulse rounded-md bg-cream-300 ${className}`} />;

/** Page-shaped placeholder: title, stat cards and two content cards. */
function AdminSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading">
      <Bar className="h-8 w-56" />
      <Bar className="mt-3 h-4 w-40" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <Bar className="h-3.5 w-24" />
            <Bar className="mt-4 h-10 w-16" />
          </div>
        ))}
      </div>
      <Card className="mt-6 p-5"><Bar className="h-4 w-36" /><Bar className="mt-4 h-3.5 w-full" /><Bar className="mt-4 h-24 w-full" /></Card>
      <Card className="mt-6 p-5"><Bar className="h-4 w-40" /><Bar className="mt-5 h-52 w-full" /></Card>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Shows a loading, offline or error view instead of the page while the live feed is not ready. */
export function FeedGate({ children }) {
  const { feedStatus, retryFeed } = useLibrary();
  if (feedStatus === "ready") return children;
  if (feedStatus === "loading") return <AdminSkeleton />;
  if (feedStatus === "offline") {
    return <MessageCard icon={WifiOff} title="Live data is unavailable" text="We can't reach the sensors and reservations right now. The page will update once the connection is back." />;
  }
  return <MessageCard icon={AlertTriangle} title="Something went wrong" text="We couldn't load the latest data. Please try again." action={<Button variant="primary" onClick={retryFeed}>Try again</Button>} />;
}
