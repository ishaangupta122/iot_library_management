import { Armchair } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SeatTile } from "@/components/seats/SeatTile";
import { useLibrary } from "@/context/LibraryContext";

/** One card per floor with every seat on it. Works for any number of seats and floors. */
export function SeatMap({ seats, selectedId, onSelect, bare = false }) {
  const { floors } = useLibrary();

  if (seats.length === 0) {
    if (bare) return <div className="border-t border-line"><EmptyState icon={Armchair} title="No seats match these filters" description="Clear a filter or search term to see the seat layout again." /></div>;
    return (
      <Card>
        <EmptyState icon={Armchair} title="No seats match these filters" description="Clear a filter or search term to see the seat layout again." />
      </Card>
    );
  }

  // `bare` renders the floors without their own cards so they can sit inside another card.
  const Wrapper = bare ? "div" : "div";
  return (
    <Wrapper className={bare ? "" : "space-y-6"}>
      {floors.map((floor) => {
        const floorSeats = seats.filter((s) => s.floorId === floor.id);
        if (floorSeats.length === 0) return null;
        const occupied = floorSeats.filter((s) => s.status === "occupied").length;
        const Block = bare ? "div" : Card;
        return (
          <Block key={floor.id} className={bare ? "border-t border-line" : undefined}>
            <div className={`flex items-center justify-between gap-2 px-5 py-4 ${bare ? "" : "border-b border-line"}`}>
              <h2 className="text-base font-semibold">{floor.name}</h2>
              <span className="text-[13px] text-muted">{occupied} of {floorSeats.length} occupied</span>
            </div>
            <div className={`grid grid-cols-2 gap-3 px-5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 ${bare ? "pb-5" : "p-5"}`}>
              {floorSeats.map((seat) => (
                <SeatTile key={seat.id} seat={seat} selected={seat.id === selectedId} onSelect={onSelect} />
              ))}
            </div>
          </Block>
        );
      })}
    </Wrapper>
  );
}
