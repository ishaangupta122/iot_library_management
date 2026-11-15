import { CONFIG } from "../config.js";
import { floors, library, MOCK_NOW, operatingHours, seats, devices, sensorReadings, students } from "../mockData.js";
import { openWindow } from "./hours.js";
import { addDays, dateKeyOf, hourOfDay, MIN, weekdayOf } from "./utils.js";

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

function openDays(nowMs = NOW_MS, days = HISTORY_DAYS, hours = operatingHours) {
  const today = dateKeyOf(nowMs);
  return Array.from({ length: days }, (_, i) => days - 1 - i)
    .map((daysAgo) => ({ daysAgo, window: openWindow(hours, addDays(today, -daysAgo)) }))
    .filter((d) => d.window)
    .map((d) => ({ ...d, weekday: weekdayOf(d.window.openMs) }));
}

/** Past sessions in the recorder's format, one list per open day. Today is excluded unless includeToday. */
export function sessionHistory({ nowMs = NOW_MS, days = HISTORY_DAYS, hours = operatingHours, seed = 20261103, includeToday = true } = {}) {
  const rng = random(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  const list = [];
  for (const { daysAgo, window, weekday } of openDays(nowMs, days, hours)) {
    if (daysAgo === 0 && !includeToday) continue;
    const dayBusyness = Math.min(1.4, Math.max(0.35, 0.85 + normal() * 0.25));
    const peakShift = Math.round(normal() * 1.2);
    for (const [seatId, popularity] of Object.entries(SEAT_POPULARITY)) {
      const seatToday = popularity * Math.min(1.3, Math.max(0.3, 1 + normal() * 0.3));
      if (rng() < 0.06) continue;
      const limit = daysAgo === 0 ? Math.min(window.closeMs, nowMs - TODAY_CUTOFF_MIN[seatId] * MIN) : window.closeMs;
      let cursor = window.openMs + rng() * 60 * MIN;
      while (cursor < limit - 15 * MIN) {
        const hourWeight = HOUR_WEIGHT[hourOfDay(cursor) - peakShift] ?? 0.15;
        if (rng() < hourWeight * WEEKDAY_DEMAND[weekday] * dayBusyness * seatToday * 0.7) {
          const lengthMin = Math.min(210, Math.max(8, Math.exp(Math.log(50) + normal() * 0.65)));
          const end = Math.min(cursor + lengthMin * MIN, limit);
          const breaks = lengthMin > 70 && rng() < 0.4 ? 1 + (lengthMin > 150 && rng() < 0.3 ? 1 : 0) : 0;
          const breakMinutes = breaks ? Math.round(breaks * (4 + rng() * 12)) : 0;
          list.push({ seatId, startedAt: iso(cursor), endedAt: iso(end), breakStartedAt: null, breakMinutes, breaks });
          cursor = end + (3 + Math.exp(normal() * 0.9) * 12) * MIN;
        } else {
          cursor += (8 + rng() * 14) * MIN;
        }
      }
    }
  }
  return list.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

function generateSessions() {
  const list = sessionHistory();
  list.push({ seatId: "SEAT-001", startedAt: ago(41), endedAt: null, breakStartedAt: null, breakMinutes: 0, breaks: 0 });
  list.push({ seatId: "SEAT-003", startedAt: ago(55), endedAt: null, breakStartedAt: ago(4), breakMinutes: 0, breaks: 1 });
  return withIds(list, "SES", 5);
}

/** Past kiosk reservations in the /api/reserve format: checked in (completed) or no-show (expired). */
export function reservationHistory({ nowMs = NOW_MS, days = HISTORY_DAYS, hours = operatingHours, seed = 777, includeToday = true } = {}) {
  const rng = random(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  const hold = CONFIG.reservation.holdMinutes;
  const list = [];
  for (const { daysAgo, window, weekday } of openDays(nowMs, days, hours)) {
    if (daysAgo === 0 && !includeToday) continue;
    const limit = daysAgo === 0 ? nowMs - 30 * MIN : window.closeMs - 10 * MIN;
    if (limit <= window.openMs) continue;
    const dayBusyness = Math.min(1.5, Math.max(0.2, 0.8 + normal() * 0.35));
    const noShowRate = Math.min(0.5, Math.max(0.1, 0.27 + normal() * 0.08));
    for (const [seatId, popularity] of Object.entries(SEAT_POPULARITY)) {
      const count = Math.max(0, Math.round(2.2 * WEEKDAY_DEMAND[weekday] * popularity * dayBusyness + normal() * 0.9));
      const times = [];
      while (times.length < count) {
        const t = window.openMs + rng() * (limit - window.openMs);
        if (rng() < (HOUR_WEIGHT[hourOfDay(t)] ?? 0.15) + 0.15) times.push(t);
      }
      times.sort((a, b) => a - b);
      let lastEnd = 0;
      for (const t of times) {
        if (t < lastEnd + 10 * MIN) continue;
        const student = students[Math.floor(rng() * students.length)];
        const expiresMs = t + hold * MIN;
        const base = { seatId, studentId: student.id, studentName: student.name, source: "kiosk", createdAt: iso(t), expiresAt: iso(expiresMs), durationMinutes: hold };
        list.push(
          rng() >= noShowRate
            ? { ...base, status: "completed", closedAt: iso(t + (0.2 + rng() * 0.75) * hold * MIN), closeReason: "checked-in" }
            : { ...base, status: "expired", closedAt: iso(expiresMs), closeReason: "no-show" },
        );
        lastEnd = expiresMs;
      }
    }
  }
  return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function generateReservations() {
  const hold = CONFIG.reservation.holdMinutes;
  const list = reservationHistory();
  list.push({
    seatId: "SEAT-002", studentId: students[3].id, studentName: students[3].name, source: "kiosk",
    createdAt: iso(NOW_MS - 0.2 * hold * MIN), expiresAt: iso(NOW_MS + 0.8 * hold * MIN), durationMinutes: hold,
    status: "active", closedAt: null, closeReason: null,
  });
  return withIds(list, "RSV", 4);
}

const occupancySessions = generateSessions();
const reservations = generateReservations();

export function createInitialState() {
  return structuredClone({ library, operatingHours, floors, seats, devices, sensorReadings, reservations, occupancySessions, students });
}
