export const SENSOR_VALUE = { FREE: 0, OCCUPIED: 1, BREAK: 2 };

export const SENSORS = [
  { key: "ir1", deviceId: "S-01", seatId: "SEAT-001" },
  { key: "ir2", deviceId: "S-02", seatId: "SEAT-002" },
  { key: "ir3", deviceId: "S-03", seatId: "SEAT-003" },
];

export const sensorForSeat = (seatId) => SENSORS.find((s) => s.seatId === seatId) ?? null;

export function parseSensorValue(raw) {
  const value = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  return value === 0 || value === 1 || value === 2 ? value : null;
}

export function readSensors(node) {
  const out = {};
  for (const { key, deviceId } of SENSORS) {
    const value = parseSensorValue(node?.[key]);
    if (value !== null) out[deviceId] = { value };
  }
  return out;
}
