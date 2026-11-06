/**
 * Development-only helpers for simulating time. Kept apart from the data
 * definitions and from the future Firebase layer.
 */

/**
 * Advance the mock clock by `ms` as a running library would: sensors that are
 * healthy keep reporting, while offline or stale ones stay that way.
 */
export function tickLiveClock(state, ms) {
  const nextMs = Date.parse(state.now) + ms;
  const now = new Date(nextMs).toISOString();
  const timeoutMs = state.settings.sensors.timeoutSeconds * 1000;
  const healthy = (device) => {
    const reading = state.sensorReadings[device.id];
    return device.isActive && reading && nextMs - Date.parse(device.lastSeenAt) <= timeoutMs && nextMs - Date.parse(reading.updatedAt) <= timeoutMs;
  };
  const healthyDevices = state.devices.filter(healthy);
  const ids = new Set(healthyDevices.map((d) => d.id));
  return {
    now,
    devices: state.devices.map((d) => (ids.has(d.id) ? { ...d, lastSeenAt: now } : d)),
    sensorReadings: Object.fromEntries(Object.entries(state.sensorReadings).map(([id, r]) => [id, ids.has(id) ? { ...r, updatedAt: now } : r])),
  };
}
