import { MapPin } from "lucide-react";
import SeatCard from "./SeatCard";

export default function SeatLayout({ seats }) {
  const [top, bottom] = [seats.slice(0, 2), seats.slice(2, 4)];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      {/* Header — consistent with ChartCard in admin */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <MapPin size={15} className="text-blue-600" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Seat Layout</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Real-time seat availability
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{" "}
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Occupied
          </span>
        </div>
      </div>

      {/* Grid — top seats → table → bottom seats */}
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="flex items-end gap-28">
          {top.map((seat) => (
            <SeatCard key={seat.id} seat={seat} />
          ))}
        </div>

        <div className="w-64 h-28 bg-linear-to-b from-amber-100 to-amber-200 border-2 border-amber-300 rounded-2xl flex items-center justify-center shadow-inner">
          <div className="text-center">
            <span className="text-xs font-bold text-amber-700 tracking-widest uppercase">
              Study Table
            </span>
            <div className="mt-1.5 flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-amber-500"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-28">
          {bottom.map((seat) => (
            <SeatCard key={seat.id} seat={seat} />
          ))}
        </div>
      </div>
    </div>
  );
}
