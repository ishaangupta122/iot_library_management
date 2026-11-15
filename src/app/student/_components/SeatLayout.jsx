"use client";

import { useState } from "react";
import { Armchair } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SeatDetails } from "@/components/seats/SeatDetails";
import { SeatTile } from "@/components/seats/SeatTile";
import { useLibrary } from "@/context/LibraryContext";
import { SeatLegend } from "@/components/seats/SeatLegend";

function SeatGrid({ seats, selectedId, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      {seats.map((seat) => (
        <SeatTile key={seat.id} seat={seat} selected={seat.id === selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

function SeatLayoutCard({ seats, selectedId, onSelect }) {
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
            <SeatLegend />
          </div>
          <SeatGrid seats={floorSeats} selectedId={selectedId} onSelect={onSelect} />
        </Card>
      ))}
    </div>
  );
}

export function LiveSeatLayout() {
  const { publicSeatViews } = useLibrary();
  const [selectedId, setSelectedId] = useState(null);
  return (
    <>
      <SeatLayoutCard seats={publicSeatViews} selectedId={selectedId} onSelect={(s) => setSelectedId(s.id)} />
      <SeatDetails seatId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
