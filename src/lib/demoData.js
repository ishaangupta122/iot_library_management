import { CONFIG } from "@/config";
import { floors, library, MOCK_NOW, operatingHours, seats, devices, sensorReadings, students } from "@/mockData";
import { openWindow } from "@/lib/hours";
import { addDays, dateKeyOf, hourOfDay, MIN, weekdayOf } from "@/lib/utils";

const HISTORY_DAYS = 90;
const HOUR_WEIGHT = { 8: 0.25, 9: 0.4, 10: 0.6, 11: 0.8, 12: 0.7, 13: 0.55, 14: 0.7, 15: 0.8, 16: 0.85, 17: 0.75, 18: 0.55, 19: 0.45, 20: 0.35, 21: 0.2 };
const WEEKDAY_DEMAND = [0.4, 0.85, 1, 1, 0.95, 0.7, 0.55];
const SEAT_POPULARITY = { "SEAT-001": 1, "SEAT-002": 0.9, "SEAT-003": 0.8 };
const TODAY_CUTOFF_MIN = { "SEAT-001": 60, "SEAT-002": 10, "SEAT-003": 60 };

const NOW_MS = Date.parse(MOCK_NOW);
const iso = (ms) => new Date(ms).toISOString();
const ago = (minutes) => iso(NOW_MS - minutes * MIN);
const withIds = (list, prefix, width) => list.map((item, i) => ({ id: `${prefix}-${String(i + 1).padStart(width, "0")}`, ...item }));

function random(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function openDays() {
  const today = dateKeyOf(NOW_MS);
  return Array.from({ length: HISTORY_DAYS }, (_, i) => HISTORY_DAYS - 1 - i)
    .map((daysAgo) => ({ daysAgo, window: openWindow(operatingHours, addDays(today, -daysAgo)) }))
    .filter((d) => d.window)
    .map((d) => ({ ...d, weekday: weekdayOf(d.window.openMs) }));
}

function generateSessions() {
  const rng = random(20261103);
  const list = [];
  for (const { daysAgo, window, weekday } of openDays()) {
    for (const [seatId, popularity] of Object.entries(SEAT_POPULARITY)) {
      const limit = daysAgo === 0 ? Math.min(window.closeMs, NOW_MS - TODAY_CUTOFF_MIN[seatId] * MIN) : window.closeMs;
      let cursor = window.openMs + rng() * 45 * MIN;
      while (cursor < limit - 15 * MIN) {
        if (rng() < (HOUR_WEIGHT[hourOfDay(cursor)] ?? 0.2) * WEEKDAY_DEMAND[weekday] * popularity) {
          const lengthMin = 20 + Math.pow(rng(), 1.6) * 130;
          const end = Math.min(cursor + lengthMin * MIN, limit);
          const breaks = lengthMin > 60 && rng() < 0.35 ? 1 : 0;
          list.push({ seatId, startedAt: iso(cursor), endedAt: iso(end), breakStartedAt: null, breakMinutes: breaks ? Math.round(5 + rng() * 10) : 0, breaks });
          cursor = end + (5 + rng() * 25) * MIN;
        } else {
          cursor += 15 * MIN;
        }
      }
    }
  }
  list.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  list.push({ seatId: "SEAT-001", startedAt: ago(41), endedAt: null, breakStartedAt: null, breakMinutes: 0, breaks: 0 });
  list.push({ seatId: "SEAT-003", startedAt: ago(55), endedAt: null, breakStartedAt: ago(4), breakMinutes: 0, breaks: 1 });
  return withIds(list, "SES", 5);
}

function generateReservations() {
  const rng = random(777);
  const hold = CONFIG.reservation.holdMinutes;
  const list = [];
  for (const { daysAgo, window, weekday } of openDays()) {
    const limit = daysAgo === 0 ? NOW_MS - 30 * MIN : window.closeMs - 10 * MIN;
    for (const [seatId, popularity] of Object.entries(SEAT_POPULARITY)) {
      const count = Math.floor(rng() * 3 * WEEKDAY_DEMAND[weekday] * popularity + 0.6);
      const times = Array.from({ length: count }, () => window.openMs + rng() * (limit - window.openMs)).sort((a, b) => a - b);
      let lastEnd = 0;
      for (const t of times) {
        if (t < lastEnd + 10 * MIN) continue;
        const student = students[Math.floor(rng() * students.length)];
        const expiresMs = t + hold * MIN;
        const base = { seatId, studentId: student.id, studentName: student.name, source: "kiosk", createdAt: iso(t), expiresAt: iso(expiresMs), durationMinutes: hold };
        list.push(
          rng() < 0.68
            ? { ...base, status: "completed", closedAt: iso(t + (1 + rng() * 3.5) * MIN), closeReason: "checked-in" }
            : { ...base, status: "expired", closedAt: iso(expiresMs), closeReason: "no-show" },
        );
        lastEnd = expiresMs;
      }
    }
  }
  list.push({
    seatId: "SEAT-002", studentId: students[3].id, studentName: students[3].name, source: "kiosk",
    createdAt: ago(2), expiresAt: iso(NOW_MS + (hold - 2) * MIN), durationMinutes: hold,
    status: "active", closedAt: null, closeReason: null,
  });
  list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return withIds(list, "RSV", 4);
}

const occupancySessions = generateSessions();
const reservations = generateReservations();

export function createInitialState() {
  return structuredClone({ library, operatingHours, floors, seats, devices, sensorReadings, reservations, occupancySessions, students });
}
