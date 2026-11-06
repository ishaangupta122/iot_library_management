"use client";

import { useState } from "react";
import { SeatDetails } from "@/components/seats/SeatDetails";
import { SeatLayoutCard } from "@/app/student/_components/SeatLayoutCard";
import { useLibrary } from "@/context/LibraryContext";

/** Live seat layout. Selecting a seat only opens its information. */
export function LiveSeatLayout() {
  const { seatViews } = useLibrary();
  const [selectedId, setSelectedId] = useState(null);
  return (
    <>
      <SeatLayoutCard seats={seatViews} selectedId={selectedId} onSelect={(s) => setSelectedId(s.id)} />
      <SeatDetails seatId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
