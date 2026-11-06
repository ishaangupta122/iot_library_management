/**
 * Single source of truth for the Smart Library mock data.
 *
 * Shared by the Admin Dashboard now, and by the Student Website and the
 * Reservation Kiosk later. Every entity has a permanent ID (SEAT-001,
 * DEV-1001, RSV-0001, ...) and the same status vocabulary everywhere.
 *
 * Collections mirror a future Firebase Realtime Database layout:
 *   /library  /floors  /sections  /seats  /devices  /sensorReadings
 *   /reservations  /occupancySessions  /notifications  /announcements ...
 *
 * Physical occupancy (`sensorReadings`) is stored separately from
 * reservations, and seat status is NEVER stored: it is derived by
 * `lib/seatStatus.js` so it can move to Cloud Functions unchanged.
 *
 * History (sessions / reservations) is generated with a seeded PRNG so every
 * load is identical. Replace `createInitialState()` with Firebase listeners
 * when the backend is ready.
 */

/* -------------------------------------------------------------------------- */
/* Time base                                                                  */
/* -------------------------------------------------------------------------- */

export const LIBRARY_TIMEZONE = "Asia/Kolkata";
export const LIBRARY_UTC_OFFSET_MIN = 330;
/** Frozen "current time" so server and client render identically. */
export const MOCK_NOW = "2026-11-03T09:30:00.000Z"; // 15:00 IST

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const NOW_MS = Date.parse(MOCK_NOW);
const OFFSET_MS = LIBRARY_UTC_OFFSET_MIN * MIN;

const iso = (ms) => new Date(ms).toISOString();
const ago = (minutes) => iso(NOW_MS - minutes * MIN);
const fromNow = (minutes) => iso(NOW_MS + minutes * MIN);
const pad = (n, width) => String(n).padStart(width, "0");
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const hourOf = (ms) => Math.floor((((ms + OFFSET_MS) % DAY) + DAY) % DAY / HOUR);

/* -------------------------------------------------------------------------- */
/* Static definitions                                                         */
/* -------------------------------------------------------------------------- */

export const library = {
  id: "LIB-001",
  name: "Central Library",
  address: "12 University Road, Lakeview Campus, Pune 411007",
  phone: "+91 20 5550 1420",
  email: "desk@lakeviewlibrary.example",
  timezone: LIBRARY_TIMEZONE,
};

export const operatingHours = [
  { day: 0, label: "Sunday", open: "10:00", close: "18:00", closed: false },
  { day: 1, label: "Monday", open: "08:00", close: "22:00", closed: false },
  { day: 2, label: "Tuesday", open: "08:00", close: "22:00", closed: false },
  { day: 3, label: "Wednesday", open: "08:00", close: "22:00", closed: false },
  { day: 4, label: "Thursday", open: "08:00", close: "22:00", closed: false },
  { day: 5, label: "Friday", open: "08:00", close: "22:00", closed: false },
  { day: 6, label: "Saturday", open: "09:00", close: "20:00", closed: false },
];

export const settings = {
  reservation: {
    durationMinutes: 5,
    autoExpire: true,
    maxActivePerStudent: 1,
  },
  sensors: {
    timeoutSeconds: 120,
  },
  preferences: {
    rowsPerPage: 10,
    notifyDeviceOffline: true,
    notifyReservationExpiry: false,
    dailySummaryEmail: true,
  },
};

export const floors = [
  { id: "FLR-1", name: "Ground Floor", level: 0 },
];

export const sections = [
  { id: "SEC-1A", floorId: "FLR-1", name: "Quiet Reading Room" },
  { id: "SEC-1B", floorId: "FLR-1", name: "Group Study Hall" },
];

export const seats = [
  { id: "SEAT-001", number: "A-01", floorId: "FLR-1", sectionId: "SEC-1A", deviceId: "DEV-1001", enabled: true, maintenance: false, notes: "Window side, power outlet.", createdAt: "2026-08-01T05:00:00.000Z" },
  { id: "SEAT-002", number: "A-02", floorId: "FLR-1", sectionId: "SEC-1A", deviceId: "DEV-1002", enabled: true, maintenance: false, notes: "", createdAt: "2026-08-01T05:00:00.000Z" },
  { id: "SEAT-003", number: "B-01", floorId: "FLR-1", sectionId: "SEC-1B", deviceId: "DEV-1003", enabled: true, maintenance: false, notes: "Shared table, whiteboard nearby.", createdAt: "2026-08-01T05:00:00.000Z" },
  { id: "SEAT-004", number: "B-02", floorId: "FLR-1", sectionId: "SEC-1B", deviceId: "DEV-1004", enabled: true, maintenance: false, notes: "", createdAt: "2026-08-01T05:00:00.000Z" },
];

export const devices = [
  { id: "DEV-1001", seatId: "SEAT-001", sensorType: "Pressure sensor", model: "FSR-402 + ESP32", firmware: "v1.4.2", macAddress: "24:6F:28:A1:10:01", ipAddress: "192.168.10.21", signalDbm: -52, isActive: true, installedAt: "2026-08-01T06:30:00.000Z", lastSeenAt: ago(0.2) },
  { id: "DEV-1002", seatId: "SEAT-002", sensorType: "Pressure sensor", model: "FSR-402 + ESP32", firmware: "v1.4.2", macAddress: "24:6F:28:A1:10:02", ipAddress: "192.168.10.22", signalDbm: -58, isActive: true, installedAt: "2026-08-01T06:40:00.000Z", lastSeenAt: ago(0.3) },
  { id: "DEV-1003", seatId: "SEAT-003", sensorType: "Capacitive seat sensor", model: "CAP-SEAT-02 + ESP32", firmware: "v1.4.1", macAddress: "24:6F:28:A1:10:03", ipAddress: "192.168.10.23", signalDbm: -63, isActive: true, installedAt: "2026-08-02T05:15:00.000Z", lastSeenAt: ago(0.1) },
  { id: "DEV-1004", seatId: "SEAT-004", sensorType: "Capacitive seat sensor", model: "CAP-SEAT-02 + ESP32", firmware: "v1.3.9", macAddress: "24:6F:28:A1:10:04", ipAddress: "192.168.10.24", signalDbm: -81, isActive: true, installedAt: "2026-08-02T05:30:00.000Z", lastSeenAt: ago(25) },
  { id: "DEV-1005", seatId: null, sensorType: "Ultrasonic distance sensor", model: "HC-SR04 + ESP32", firmware: "v1.2.0", macAddress: "24:6F:28:A1:10:05", ipAddress: "192.168.10.25", signalDbm: null, isActive: false, installedAt: "2026-09-12T08:00:00.000Z", lastSeenAt: ago(60 * 24 * 11) },
];

/** Latest physical reading per device. Keyed by deviceId (like /sensorReadings/{deviceId}). */
export const sensorReadings = {
  "DEV-1001": { occupied: true, updatedAt: ago(0.2) },
  "DEV-1002": { occupied: false, updatedAt: ago(0.3) },
  "DEV-1003": { occupied: false, updatedAt: ago(0.1) },
  "DEV-1004": { occupied: false, updatedAt: ago(25) },
};

export const admin = {
  id: "ADM-001",
  name: "Priya Nair",
  role: "Head Librarian",
  email: "priya.nair@lakeviewlibrary.example",
};

export const announcements = [
  { id: "ANN-006", category: "maintenance", title: "Seat B-02 sensor under maintenance", body: "The sensor on seat B-02 (Group Study Hall) is being serviced. The seat shows as Unavailable until it reconnects.", author: "Library IT", createdAt: ago(35), pinned: false },
  { id: "ANN-005", category: "closure", title: "Group Study Hall closed on Nov 9", body: "The Group Study Hall is closed for cleaning on Sunday, Nov 9. The Quiet Reading Room stays open.", author: "Priya Nair", createdAt: ago(60 * 8), pinned: false },
  { id: "ANN-003", category: "exam", title: "Extended hours during exam week", body: "The library stays open until midnight from Nov 16 to Nov 27. Seat holds at the kiosk remain 5 minutes.", author: "Priya Nair", createdAt: ago(60 * 20), pinned: true },
  { id: "ANN-004", category: "hours", title: "Sunday hours changed", body: "From this month the library opens at 10:00 AM and closes at 6:00 PM on Sundays.", author: "Priya Nair", createdAt: ago(60 * 24 * 4), pinned: false },
  { id: "ANN-002", category: "sensors", title: "Seat sensor rollout: ground floor", body: "Live availability is now active for seats A-01 and A-02. More seats will be added in phases.", author: "Priya Nair", createdAt: ago(60 * 24 * 6), pinned: false },
  { id: "ANN-001", category: "general", title: "Reservation kiosk now available", body: "Seats can be held for 5 minutes at the ground floor kiosk. This website only shows live availability.", author: "Library IT", createdAt: ago(60 * 24 * 15), pinned: false },
];

export const notifications = [
  { id: "NTF-005", type: "device", title: "Sensor DEV-1004 is offline", body: "No heartbeat from seat B-02 for 25 minutes. The seat is shown as Unavailable until it reconnects.", createdAt: ago(25), read: false, href: "/admin/monitoring" },
  { id: "NTF-004", type: "reservation", title: "New kiosk reservation", body: "Seat A-02 was reserved at the kiosk for 5 minutes.", createdAt: ago(2), read: false, href: "/admin/reservations" },
  { id: "NTF-003", type: "reservation", title: "Reservation cancelled", body: "A hold on seat B-01 was cancelled by the student.", createdAt: ago(21), read: false, href: "/admin/reservations" },
  { id: "NTF-002", type: "system", title: "Weekly usage report ready", body: "Last week's occupancy summary is ready to review.", createdAt: ago(60 * 22), read: true, href: "/admin/analytics" },
  { id: "NTF-001", type: "device", title: "Firmware update available", body: "Firmware v1.4.2 is available for DEV-1003 and DEV-1004.", createdAt: ago(60 * 24 * 3), read: true, href: "/admin/monitoring" },
];

/* -------------------------------------------------------------------------- */
/* Generated history (deterministic)                                          */
/* -------------------------------------------------------------------------- */

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HISTORY_DAYS = 90;
const TODAY_START = Math.floor((NOW_MS + OFFSET_MS) / DAY) * DAY - OFFSET_MS;
const HOUR_WEIGHT = { 8: 0.25, 9: 0.4, 10: 0.6, 11: 0.8, 12: 0.7, 13: 0.55, 14: 0.7, 15: 0.8, 16: 0.85, 17: 0.75, 18: 0.55, 19: 0.45, 20: 0.35, 21: 0.2 };
const WEEKDAY_DEMAND = [0.4, 0.85, 1, 1, 0.95, 0.7, 0.55]; // Sun..Sat
const SEAT_POPULARITY = { "SEAT-001": 1, "SEAT-002": 0.9, "SEAT-003": 0.8, "SEAT-004": 0.65 };
/** Minutes before "now" by which each seat's last completed session must have ended. */
const TODAY_CUTOFF_MIN = { "SEAT-001": 60, "SEAT-002": 10, "SEAT-003": 10, "SEAT-004": 40 };

/** Real roll numbers for the prototype: the kiosk matches the Code 128 barcode on the ID card to these. Edit and add yours. */
const REGISTERED_STUDENTS = [
  ["1024031118", "Ishaan Gupta"],
];

const STUDENTS = [
  ...REGISTERED_STUDENTS,
  ["STU-20418", "Aanya Kapoor"], ["STU-20455", "Rohan Desai"], ["STU-20512", "Ishita Verma"],
  ["STU-20533", "Kabir Malhotra"], ["STU-20601", "Neha Joshi"], ["STU-20644", "Arjun Rao"],
  ["STU-20687", "Sara Khan"], ["STU-20702", "Dev Patel"], ["STU-20739", "Meera Iyer"],
  ["STU-20781", "Vikram Singh"], ["STU-20816", "Tanvi Shah"], ["STU-20870", "Yash Bhatt"],
];

/** Registered students. Student Website and Kiosk will identify people by these IDs. */
export const students = STUDENTS.map(([id, name]) => ({
  id,
  name,
  email: `${name.split(" ")[0].toLowerCase()}.${id.slice(-5)}@students.lakeviewlibrary.example`,
  program: "B.Tech, Year 3",
}));

function dayWindow(daysAgo) {
  const dayStart = TODAY_START - daysAgo * DAY;
  const weekday = new Date(dayStart + OFFSET_MS).getUTCDay();
  const hours = operatingHours[weekday];
  if (hours.closed) return null;
  return {
    weekday,
    openMs: dayStart + toMinutes(hours.open) * MIN,
    closeMs: dayStart + toMinutes(hours.close) * MIN,
  };
}

function generateSessions() {
  const rng = mulberry32(20261103);
  const raw = [];
  for (let d = HISTORY_DAYS - 1; d >= 0; d--) {
    const win = dayWindow(d);
    if (!win) continue;
    for (const seat of seats) {
      const limit = d === 0 ? Math.min(win.closeMs, NOW_MS - TODAY_CUTOFF_MIN[seat.id] * MIN) : win.closeMs;
      let cursor = win.openMs + rng() * 45 * MIN;
      while (cursor < limit - 15 * MIN) {
        const weight = (HOUR_WEIGHT[hourOf(cursor)] ?? 0.2) * WEEKDAY_DEMAND[win.weekday] * SEAT_POPULARITY[seat.id];
        if (rng() < weight) {
          const end = Math.min(cursor + (20 + Math.pow(rng(), 1.6) * 130) * MIN, limit);
          raw.push({ seatId: seat.id, startedAt: iso(cursor), endedAt: iso(end) });
          cursor = end + (5 + rng() * 25) * MIN;
        } else {
          cursor += 15 * MIN;
        }
      }
    }
  }
  raw.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  // The one seat that is physically occupied right now has an open session.
  raw.push({ seatId: "SEAT-001", startedAt: ago(41), endedAt: null });
  return raw.map((s, i) => ({ id: `SES-${pad(i + 1, 5)}`, ...s }));
}

function generateReservations() {
  const rng = mulberry32(777);
  const holdMin = settings.reservation.durationMinutes;
  const raw = [];
  for (let d = HISTORY_DAYS - 1; d >= 0; d--) {
    const win = dayWindow(d);
    if (!win) continue;
    const limit = d === 0 ? NOW_MS - 30 * MIN : win.closeMs - 10 * MIN;
    for (const seat of seats) {
      const count = Math.floor(rng() * 3 * WEEKDAY_DEMAND[win.weekday] * SEAT_POPULARITY[seat.id] + 0.6);
      const times = Array.from({ length: count }, () => win.openMs + rng() * (limit - win.openMs)).sort((a, b) => a - b);
      let lastEnd = 0;
      for (const t of times) {
        if (t < lastEnd + 10 * MIN) continue;
        const [studentId, studentName] = STUDENTS[Math.floor(rng() * STUDENTS.length)];
        const roll = rng();
        const expiresMs = t + holdMin * MIN;
        const base = {
          seatId: seat.id, studentId, studentName,
          source: rng() < 0.6 ? "kiosk" : "student-web",
          createdAt: iso(t), expiresAt: iso(expiresMs), durationMinutes: holdMin,
        };
        if (roll < 0.6) raw.push({ ...base, status: "completed", closedAt: iso(t + (1 + rng() * 3.5) * MIN), closeReason: "checked-in" });
        else if (roll < 0.88) raw.push({ ...base, status: "expired", closedAt: iso(expiresMs), closeReason: "timeout" });
        else raw.push({ ...base, status: "cancelled", closedAt: iso(t + (0.5 + rng() * 3) * MIN), closeReason: rng() < 0.8 ? "cancelled-by-student" : "cancelled-by-admin" });
        lastEnd = expiresMs;
      }
    }
  }
  // Live data that drives the current seat states.
  raw.push({
    seatId: "SEAT-003", studentId: "STU-20533", studentName: "Kabir Malhotra", source: "student-web",
    createdAt: ago(22), expiresAt: ago(17), durationMinutes: holdMin,
    status: "cancelled", closedAt: ago(21), closeReason: "cancelled-by-student",
  });
  raw.push({
    seatId: "SEAT-002", studentId: "STU-20455", studentName: "Rohan Desai", source: "kiosk",
    createdAt: ago(2), expiresAt: fromNow(holdMin - 2), durationMinutes: holdMin,
    status: "active", closedAt: null, closeReason: null,
  });
  raw.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return raw.map((r, i) => ({ id: `RSV-${pad(i + 1, 4)}`, ...r }));
}

export const occupancySessions = generateSessions();
export const reservations = generateReservations();

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** Fresh deep copy of everything the app mutates at runtime. */
export function createInitialState() {
  return structuredClone({
    now: MOCK_NOW,
    library,
    operatingHours,
    settings,
    floors,
    sections,
    seats,
    devices,
    sensorReadings,
    reservations,
    occupancySessions,
    notifications,
    announcements,
    admin,
    students,
  });
}

export const mockData = {
  library, operatingHours, settings, floors, sections, seats, devices, sensorReadings,
  reservations, occupancySessions, notifications, announcements, admin, students,
};
