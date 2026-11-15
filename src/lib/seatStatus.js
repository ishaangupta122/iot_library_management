export const SEAT_STATUS = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  OCCUPIED: "occupied",
  UNAVAILABLE: "unavailable",
  CLOSED: "closed",
};

export const RESERVATION_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
};

const toMs = (value) => (typeof value === "number" ? value : Date.parse(value));

export function getReservationStatus(reservation, now) {
  if (reservation.status === RESERVATION_STATUS.ACTIVE && toMs(reservation.expiresAt) <= toMs(now)) return RESERVATION_STATUS.EXPIRED;
  return reservation.status;
}

function findActiveReservation(reservations, seatId, now) {
  return reservations.find((r) => r.seatId === seatId && getReservationStatus(r, now) === RESERVATION_STATUS.ACTIVE) ?? null;
}

function getSensorState(device, reading) {
  if (!device) return { state: "none", label: "No sensor" };
  if (!device.isActive || !reading) return { state: "offline", label: "No data from sensor" };
  return { state: "ok", label: "Reporting" };
}

export function deriveSeatStatus({ seat, device, reading, reservations, now }) {
  const sensor = getSensorState(device, reading);
  const reservation = findActiveReservation(reservations, seat.id, now);
  const occupied = sensor.state === "ok" ? Boolean(reading.occupied) : null;
  const result = (status, reason) => ({ status, reason, occupied, sensor, reservation });

  if (seat.maintenance) return result(SEAT_STATUS.UNAVAILABLE, "Under maintenance");
  if (!seat.enabled) return result(SEAT_STATUS.UNAVAILABLE, "Disabled by admin");
  if (sensor.state !== "ok") return result(SEAT_STATUS.UNAVAILABLE, sensor.label);
  if (occupied) return result(SEAT_STATUS.OCCUPIED, "Someone is seated");
  if (reading.onBreak) return result(SEAT_STATUS.RESERVED, "On a break, seat held");
  if (reservation) return result(SEAT_STATUS.RESERVED, "Empty, held by a kiosk reservation");
  return result(SEAT_STATUS.AVAILABLE, "Empty and free to use");
}

export function countByStatus(allSeats) {
  const seatViews = allSeats.filter((s) => !s.maintenance);
  const counts = { available: 0, reserved: 0, occupied: 0, unavailable: 0, closed: 0 };
  for (const seat of seatViews) counts[seat.status] += 1;
  const total = seatViews.length;
  const reporting = total - counts.unavailable;
  return {
    ...counts,
    total,
    reporting,
    occupancyRate: reporting > 0 ? Math.round((counts.occupied / reporting) * 100) : 0,
  };
}
