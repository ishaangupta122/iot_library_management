/**
 * Analytics derived from occupancy sessions and reservations.
 * Nothing here is stored; every number is computed from the shared data so
 * charts, reports and summaries always agree.
 *
 * `range` is { start, end } of inclusive "YYYY-MM-DD" library-local dates.
 */
import { addDays, dateKeyOf, dayStartMs, daysBetween, formatDateKey, formatHourLabel, hourOfDay, WEEKDAY_SHORT, weekdayOf } from "@/lib/utils";

const MIN = 60_000;

function rangeBounds(range) {
  return { startMs: dayStartMs(range.start), endMs: dayStartMs(addDays(range.end, 1)) };
}

function dateKeysInRange(range) {
  return Array.from({ length: daysBetween(range.start, range.end) + 1 }, (_, i) => addDays(range.start, i));
}

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Minutes the library is open on `key`, optionally cut off at `nowMs` (so today is not penalized for hours yet to come). */
const openMinutesOn = (operatingHours, key, nowMs = Infinity) => {
  const h = operatingHours[weekdayOf(dayStartMs(key) + 12 * 3_600_000)];
  if (!h || h.closed) return 0;
  const openMs = dayStartMs(key) + toMin(h.open) * MIN;
  const closeMs = Math.min(dayStartMs(key) + toMin(h.close) * MIN, nowMs);
  return Math.max(0, (closeMs - openMs) / MIN);
};

/** Session length in minutes; open sessions run until `nowMs`. */
const sessionMinutes = (session, nowMs) =>
  Math.max(0, ((session.endedAt ? Date.parse(session.endedAt) : nowMs) - Date.parse(session.startedAt)) / MIN);

export function sessionsInRange(sessions, range) {
  const { startMs, endMs } = rangeBounds(range);
  return sessions.filter((s) => {
    const t = Date.parse(s.startedAt);
    return t >= startMs && t < endMs;
  });
}

/** One row per day: occupied minutes vs. the capacity of all monitored seats while open. */
export function dailyOccupancy({ sessions, monitoredSeats, operatingHours, range, nowMs }) {
  const rows = new Map(
    dateKeysInRange(range).map((key) => {
      const weekday = weekdayOf(dayStartMs(key) + 12 * 3_600_000);
      return [key, { key, weekday, occupiedMin: 0, capacityMin: monitoredSeats * openMinutesOn(operatingHours, key, nowMs), sessions: 0 }];
    }),
  );
  for (const s of sessionsInRange(sessions, range)) {
    const row = rows.get(dateKeyOf(Date.parse(s.startedAt)));
    if (!row) continue;
    row.occupiedMin += sessionMinutes(s, nowMs);
    row.sessions += 1;
  }
  return [...rows.values()].filter((r) => r.capacityMin > 0 || r.sessions > 0);
}

const rate = (occupied, capacity) => (capacity > 0 ? Math.round((occupied / capacity) * 1000) / 10 : 0);

/** Aggregate daily rows into day / week / month buckets. */
export function bucketTrend(daily, granularity) {
  if (granularity === "daily") {
    return daily.map((d) => ({ key: d.key, label: formatDateKey(d.key), occupancy: rate(d.occupiedMin, d.capacityMin), sessions: d.sessions, occupiedHours: Math.round(d.occupiedMin / 6) / 10 }));
  }
  const groups = new Map();
  for (const d of daily) {
    let key;
    let label;
    if (granularity === "weekly") {
      const mondayOffset = (d.weekday + 6) % 7;
      key = addDays(d.key, -mondayOffset);
      label = `Week of ${formatDateKey(key)}`;
    } else {
      key = d.key.slice(0, 7);
      label = new Date(`${key}-15T12:00:00Z`).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
    }
    const g = groups.get(key) ?? { key, label, occupiedMin: 0, capacityMin: 0, sessions: 0 };
    g.occupiedMin += d.occupiedMin;
    g.capacityMin += d.capacityMin;
    g.sessions += d.sessions;
    groups.set(key, g);
  }
  return [...groups.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((g) => ({ key: g.key, label: g.label, occupancy: rate(g.occupiedMin, g.capacityMin), sessions: g.sessions, occupiedHours: Math.round(g.occupiedMin / 6) / 10 }));
}

/** Average occupancy for each hour of the day across the range (library hours only). */
export function hourlyProfile({ sessions, monitoredSeats, operatingHours, range, nowMs }) {
  const occupied = Array(24).fill(0);
  const capacity = Array(24).fill(0);
  for (const key of dateKeysInRange(range)) {
    const startMs = dayStartMs(key);
    const h = operatingHours[weekdayOf(startMs + 12 * 3_600_000)];
    if (!h || h.closed) continue;
    const openHour = Number(h.open.split(":")[0]);
    const closeHour = Number(h.close.split(":")[0]);
    for (let hour = openHour; hour < closeHour; hour++) {
      const hourStart = startMs + hour * 3_600_000;
      const minutesElapsed = Math.min(60, Math.max(0, (nowMs - hourStart) / MIN));
      capacity[hour] += monitoredSeats * minutesElapsed;
    }
  }
  for (const s of sessionsInRange(sessions, range)) {
    const start = Date.parse(s.startedAt);
    const end = s.endedAt ? Date.parse(s.endedAt) : nowMs;
    for (let t = start; t < end; ) {
      const hourEnd = (Math.floor((t + 330 * MIN) / 3_600_000) + 1) * 3_600_000 - 330 * MIN;
      const slice = Math.min(end, hourEnd) - t;
      occupied[hourOfDay(t)] += slice / MIN;
      t += slice;
    }
  }
  return occupied
    .map((occ, hour) => ({ hour, label: formatHourLabel(hour), occupancy: rate(occ, capacity[hour]), active: capacity[hour] > 0 }))
    .filter((p) => p.active);
}

/** Occupancy per hour for a single date (used for "today vs typical"). */
export function hourlyForDay({ sessions, monitoredSeats, dateKey, operatingHours, nowMs }) {
  return hourlyProfile({ sessions, monitoredSeats, operatingHours, range: { start: dateKey, end: dateKey }, nowMs });
}

export function weekdayProfile(daily) {
  const groups = Array.from({ length: 7 }, (_, weekday) => ({ weekday, occupiedMin: 0, capacityMin: 0, sessions: 0 }));
  for (const d of daily) {
    groups[d.weekday].occupiedMin += d.occupiedMin;
    groups[d.weekday].capacityMin += d.capacityMin;
    groups[d.weekday].sessions += d.sessions;
  }
  // Monday-first reads better for a library week.
  return [1, 2, 3, 4, 5, 6, 0].map((i) => ({
    label: WEEKDAY_SHORT[i],
    occupancy: rate(groups[i].occupiedMin, groups[i].capacityMin),
    sessions: groups[i].sessions,
  }));
}

export function durationStats(sessions, nowMs) {
  const closed = sessions.filter((s) => s.endedAt);
  const minutes = closed.map((s) => sessionMinutes(s, nowMs)).sort((a, b) => a - b);
  const total = minutes.reduce((sum, m) => sum + m, 0);
  const buckets = [
    { label: "< 30 min", min: 0, max: 30 },
    { label: "30–60 min", min: 30, max: 60 },
    { label: "1–2 h", min: 60, max: 120 },
    { label: "2 h +", min: 120, max: Infinity },
  ].map((b) => ({ label: b.label, sessions: minutes.filter((m) => m >= b.min && m < b.max).length }));
  return {
    count: minutes.length,
    averageMin: minutes.length ? total / minutes.length : 0,
    medianMin: minutes.length ? minutes[Math.floor(minutes.length / 2)] : 0,
    longestMin: minutes.length ? minutes[minutes.length - 1] : 0,
    totalMin: total,
    buckets,
  };
}

/** Average length of a finished session for each weekday (Monday first), in minutes. */
export function avgSessionByWeekday(sessions, nowMs) {
  const groups = Array.from({ length: 7 }, () => ({ minutes: 0, count: 0 }));
  for (const s of sessions) {
    if (!s.endedAt) continue;
    const g = groups[weekdayOf(Date.parse(s.startedAt))];
    g.minutes += sessionMinutes(s, nowMs);
    g.count += 1;
  }
  return [1, 2, 3, 4, 5, 6, 0].map((i) => ({ label: WEEKDAY_SHORT[i], minutes: groups[i].count ? Math.round(groups[i].minutes / groups[i].count) : 0 }));
}

