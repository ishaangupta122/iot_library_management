/**
 * Seat-state business rules. Pure functions with no React or UI imports, so
 * they can be reused by the Student Website, the Kiosk, or Cloud Functions.
 *
 *   Occupied    sensor fresh and reports someone seated (reservation ignored)
 *   Reserved    sensor fresh, seat empty, active reservation exists
 *   Available   sensor fresh, seat empty, no active reservation
 *   Unavailable maintenance / disabled / no sensor / sensor offline or stale
 */

export const SEAT_STATUS = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  OCCUPIED: "occupied",
  UNAVAILABLE: "unavailable",
};

export const RESERVATION_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
};

export const DEVICE_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
  INACTIVE: "inactive",
};

const toMs = (value) => (typeof value === "number" ? value : Date.parse(value));

/** A stored "active" reservation past its expiry is treated as expired. */
export function getReservationStatus(reservation, now, autoExpire = true) {
  if (reservation.status === RESERVATION_STATUS.ACTIVE && autoExpire && toMs(reservation.expiresAt) <= toMs(now)) {
    return RESERVATION_STATUS.EXPIRED;
  }
  return reservation.status;
}

export function findActiveReservation(reservations, seatId, now, autoExpire = true) {
  return (
    reservations.find(
      (r) => r.seatId === seatId && getReservationStatus(r, now, autoExpire) === RESERVATION_STATUS.ACTIVE,
    ) ?? null
  );
}

export function getDeviceStatus(device, now, timeoutMs) {
  if (!device.isActive) return DEVICE_STATUS.INACTIVE;
  if (!device.lastSeenAt || toMs(now) - toMs(device.lastSeenAt) > timeoutMs) return DEVICE_STATUS.OFFLINE;
  return DEVICE_STATUS.ONLINE;
}

/**
 * How trustworthy is the sensor right now?
 * state: "fresh" | "stale" | "offline" | "inactive" | "none"
 */
export function getSensorState(device, reading, now, timeoutMs) {
  if (!device) return { state: "none", label: "No sensor assigned", ageSeconds: null };
  const deviceStatus = getDeviceStatus(device, now, timeoutMs);
  if (deviceStatus === DEVICE_STATUS.INACTIVE) return { state: "inactive", label: "Sensor inactive", ageSeconds: null };
  if (deviceStatus === DEVICE_STATUS.OFFLINE) {
    return { state: "offline", label: "Sensor offline", ageSeconds: Math.round((toMs(now) - toMs(device.lastSeenAt)) / 1000) };
  }
  if (!reading) return { state: "none", label: "No reading received", ageSeconds: null };
  const ageSeconds = Math.round((toMs(now) - toMs(reading.updatedAt)) / 1000);
  if (ageSeconds * 1000 > timeoutMs) return { state: "stale", label: "Sensor data stale", ageSeconds };
  return { state: "fresh", label: "Sensor reporting", ageSeconds };
}

/**
 * Derive the display status of one seat.
 * Returns { status, reason, occupied, sensor, reservation }.
 * `occupied` is the raw physical reading (true/false) or null when unknown.
 */
export function deriveSeatStatus({ seat, device, reading, reservations, now, timeoutMs, autoExpire = true }) {
  const sensor = getSensorState(device, reading, now, timeoutMs);
  const reservation = findActiveReservation(reservations, seat.id, now, autoExpire);
  const sensorTrusted = sensor.state === "fresh";
  const occupied = sensorTrusted ? Boolean(reading.occupied) : null;
  const result = (status, reason) => ({ status, reason, occupied, sensor, reservation });

  if (seat.maintenance) return result(SEAT_STATUS.UNAVAILABLE, "Under maintenance");
  if (!seat.enabled) return result(SEAT_STATUS.UNAVAILABLE, "Disabled by admin");
  if (!device) return result(SEAT_STATUS.UNAVAILABLE, "No sensor assigned (unmonitored)");
  if (!sensorTrusted) return result(SEAT_STATUS.UNAVAILABLE, `${sensor.label}: seat state unknown`);
  if (occupied) return result(SEAT_STATUS.OCCUPIED, "Someone is seated");
  if (reservation) return result(SEAT_STATUS.RESERVED, "Empty, held by an active reservation");
  return result(SEAT_STATUS.AVAILABLE, "Empty and free to use");
}

export function countByStatus(seatViews) {
  const counts = { available: 0, reserved: 0, occupied: 0, unavailable: 0 };
  for (const seat of seatViews) counts[seat.status] += 1;
  const total = seatViews.length;
  const reporting = total - counts.unavailable;
  return {
    ...counts,
    total,
    reporting,
    /** Share of seats with trusted sensor data that are physically occupied. */
    occupancyRate: reporting > 0 ? Math.round((counts.occupied / reporting) * 100) : 0,
  };
}
