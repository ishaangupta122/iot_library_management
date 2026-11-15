import { HOUR, MIN, WEEKDAY_SHORT, addDays, dateKeyOf, dayStartMs, daysBetween, formatDateKey, formatHourLabel, hourOfDay, weekdayOf } from "@/lib/utils";
import { openWindow, overlapMin } from "@/lib/hours";


function rangeBounds(range) {
  return { startMs: dayStartMs(range.start), endMs: dayStartMs(addDays(range.end, 1)) };
}

function dateKeysInRange(range) {
  return Array.from({ length: daysBetween(range.start, range.end) + 1 }, (_, i) => addDays(range.start, i));
}

const openMinutesOn = (operatingHours, key, nowMs = Infinity) => {
  const w = openWindow(operatingHours, key);
  return w ? Math.max(0, (Math.min(w.closeMs, nowMs) - w.openMs) / MIN) : 0;
};

const sessionEnd = (s, nowMs) => Math.min(s.endedAt ? Date.parse(s.endedAt) : nowMs, nowMs);

const sessionMinutes = (session, nowMs) =>
  Math.max(0, ((session.endedAt ? Date.parse(session.endedAt) : nowMs) - Date.parse(session.startedAt)) / MIN);

export function historyRange(sessions, today, days) {
  const first = sessions.reduce((min, s) => (s.startedAt < min ? s.startedAt : min), "9999");
  const firstKey = first === "9999" ? today : dateKeyOf(Date.parse(first));
  const start = addDays(today, -(days - 1));
  return { start: firstKey > start ? (firstKey > today ? today : firstKey) : start, end: today };
}

export function sessionsInRange(sessions, range) {
  const { startMs, endMs } = rangeBounds(range);
  return sessions.filter((s) => {
    const t = Date.parse(s.startedAt);
    return t >= startMs && t < endMs;
  });
}

export function dailyOccupancy({ sessions, monitoredSeats, operatingHours, range, nowMs }) {
  const rows = new Map(
    dateKeysInRange(range).map((key) => {
      const weekday = weekdayOf(dayStartMs(key) + 12 * 3_600_000);
      return [key, { key, weekday, occupiedMin: 0, capacityMin: monitoredSeats * openMinutesOn(operatingHours, key, nowMs), sessions: 0 }];
    }),
  );
  for (const s of sessions) {
    const start = Date.parse(s.startedAt);
    const end = sessionEnd(s, nowMs);
    const first = rows.get(dateKeyOf(start));
    if (first) first.sessions += 1;
    for (let key = dateKeyOf(start); key <= dateKeyOf(end); key = addDays(key, 1)) {
      const row = rows.get(key);
      const w = row && openWindow(operatingHours, key);
      if (w) row.occupiedMin += overlapMin(start, end, w);
    }
  }
  return [...rows.values()].filter((r) => r.capacityMin > 0);
}

const rate = (occupied, capacity) => (capacity > 0 ? Math.round((occupied / capacity) * 1000) / 10 : 0);

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

export function hourlyProfile({ sessions, monitoredSeats, operatingHours, range, nowMs }) {
  const occupied = Array(24).fill(0);
  const capacity = Array(24).fill(0);
  for (const key of dateKeysInRange(range)) {
    const w = openWindow(operatingHours, key);
    if (!w) continue;
    const startMs = dayStartMs(key);
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = startMs + hour * HOUR;
      capacity[hour] += monitoredSeats * overlapMin(hourStart, Math.min(hourStart + HOUR, nowMs), w);
    }
  }
  for (const s of sessionsInRange(sessions, range)) {
    const end = sessionEnd(s, nowMs);
    for (let t = Date.parse(s.startedAt); t < end; ) {
      const hourEnd = (Math.floor((t + 330 * MIN) / HOUR) + 1) * HOUR - 330 * MIN;
      const sliceEnd = Math.min(end, hourEnd);
      const w = openWindow(operatingHours, dateKeyOf(t));
      if (w) occupied[hourOfDay(t)] += overlapMin(t, sliceEnd, w);
      t = sliceEnd;
    }
  }
  return occupied
    .map((occ, hour) => ({ hour, label: formatHourLabel(hour), occupancy: rate(occ, capacity[hour]), active: capacity[hour] > 0 }))
    .filter((p) => p.active);
}

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

