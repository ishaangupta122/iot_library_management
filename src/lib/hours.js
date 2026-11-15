import { addDays, dateKeyOf, dayStartMs, MIN, WEEKDAY_LONG, weekdayOf } from "@/lib/utils";

export const ALL_DAY = { open: "00:00", close: "24:00" };
export const DEFAULT_DAY = { open: "08:00", close: "22:00" };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const is24h = (h) => !h.closed && h.open === ALL_DAY.open && h.close === ALL_DAY.close;

export function openWindow(operatingHours, key) {
  const h = operatingHours.find((x) => x.day === weekdayOf(dayStartMs(key) + 12 * 3_600_000));
  if (!h || h.closed) return null;
  const start = dayStartMs(key);
  return { openMs: start + toMin(h.open) * MIN, closeMs: start + toMin(h.close) * MIN };
}

export const overlapMin = (a, b, w) => Math.max(0, Math.min(b, w.closeMs) - Math.max(a, w.openMs)) / MIN;

export function validateHours(hours) {
  if (!Array.isArray(hours) || hours.length !== 7) return { all: "Send all seven days." };
  const errors = {};
  const seen = new Set();
  for (const h of hours) {
    if (!h || !Number.isInteger(h.day) || h.day < 0 || h.day > 6 || seen.has(h.day)) return { all: "Each weekday must appear once." };
    seen.add(h.day);
    if (h.closed === true) continue;
    if (!TIME.test(h.open ?? "")) errors[h.day] = "Enter an opening time.";
    else if (!(TIME.test(h.close ?? "") || h.close === "24:00")) errors[h.day] = "Enter a closing time.";
    else if (toMin(h.close) <= toMin(h.open)) errors[h.day] = "Closing time must be after opening time.";
  }
  return Object.keys(errors).length ? errors : null;
}

export const normalizeHours = (hours) =>
  [...hours]
    .sort((a, b) => a.day - b.day)
    .map((h) => ({ day: h.day, label: WEEKDAY_LONG[h.day], open: h.open, close: h.close, closed: h.closed === true }));

export const clock = (hhmm) => {
  if (hhmm === "24:00") return "midnight";
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
};

export function libraryStatus(operatingHours, nowMs) {
  const today = dateKeyOf(nowMs);
  const w = openWindow(operatingHours, today);
  const todayHours = operatingHours.find((x) => x.day === weekdayOf(nowMs));
  if (w && nowMs >= w.openMs && nowMs < w.closeMs) {
    return { open: true, text: is24h(todayHours) ? "Open 24 hours today" : `Open now · closes ${clock(todayHours.close)}` };
  }
  for (let i = 0; i <= 7; i++) {
    const key = addDays(today, i);
    const next = openWindow(operatingHours, key);
    if (next && next.openMs > nowMs) {
      const h = operatingHours.find((x) => x.day === weekdayOf(next.openMs));
      const when = i === 0 ? "" : i === 1 ? " tomorrow" : ` ${WEEKDAY_LONG[h.day]}`;
      return { open: false, text: `Closed · opens ${clock(h.open)}${when}` };
    }
  }
  return { open: false, text: "Closed" };
}
