/** Letters and digits only, upper case, so "1024-031118 " and "1024031118" are the same roll number. */
export const normalizeRoll = (value) => String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

export const DEFAULT_SETTINGS = {
  reservation: { durationMinutes: 5, autoExpire: true, maxActivePerStudent: 1 },
  sensors: { timeoutSeconds: 120 },
  preferences: { rowsPerPage: 10, notifyDeviceOffline: true, notifyReservationExpiry: false, dailySummaryEmail: true },
};
