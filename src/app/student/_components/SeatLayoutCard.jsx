import { Armchair } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SeatTile } from "@/components/seats/SeatTile";
import { useLibrary } from "@/context/LibraryContext";

const LEGEND = [
  { label: "Available", dot: "bg-ok-700" },
  { label: "Occupied", dot: "bg-brand-700" },
  { label: "Reserved", dot: "bg-warn-700" },
  { label: "Unavailable", dot: "bg-ink-soft/60" },
];

/** Same seat tiles and grid as the admin Live Monitoring page, left-aligned. */
function SeatGrid({ seats, selectedId, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      {seats.map((seat) => (
        <SeatTile key={seat.id} seat={seat} selected={seat.id === selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

/** Ground floor only for now; extend `slice(0, 1)` when more floors go live. */
export function SeatLayoutCard({ seats, selectedId, onSelect }) {
  const { floors } = useLibrary();
  const groups = floors.slice(0, 1).map((floor) => ({ floor, seats: seats.filter((s) => s.floorId === floor.id) })).filter((g) => g.seats.length);

  if (groups.length === 0) {
    return <Card><EmptyState icon={Armchair} title="No seats match these filters" description="Clear the search or status filter to see the layout again." /></Card>;
  }

  return (
    <div className="space-y-6">
      {groups.map(({ floor, seats: floorSeats }) => (
        <Card key={floor.id}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-4">
            <h2 className="text-base font-semibold">{floor.name}</h2>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5" aria-label="Seat status legend">
              {LEGEND.map((l) => (
                <li key={l.label} className="flex items-center gap-2 text-[13px] font-medium text-ink-soft"><span className={`h-2.5 w-2.5 rounded-full ${l.dot}`} aria-hidden="true" />{l.label}</li>
              ))}
            </ul>
          </div>
          <SeatGrid seats={floorSeats} selectedId={selectedId} onSelect={onSelect} />
        </Card>
      ))}
    </div>
  );
}
