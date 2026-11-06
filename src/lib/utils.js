import { LIBRARY_TIMEZONE, LIBRARY_UTC_OFFSET_MIN } from "@/data/mockData";

export const cn = (...classes) => classes.flat().filter(Boolean).join(" ");

const MIN = 60_000;
const DAY = 86_400_000;
const OFFSET_MS = LIBRARY_UTC_OFFSET_MIN * MIN;

const formatter = (options) => new Intl.DateTimeFormat("en-US", { timeZone: LIBRARY_TIMEZONE, ...options });
const timeFmt = formatter({ hour: "numeric", minute: "2-digit", hour12: true });
const dateFmt = formatter({ month: "short", day: "numeric", year: "numeric" });
const shortDateFmt = formatter({ month: "short", day: "numeric" });
const dateTimeFmt = formatter({ month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

export const formatTime = (value) => (value ? timeFmt.format(new Date(value)) : "—");
export const formatDate = (value) => (value ? dateFmt.format(new Date(value)) : "—");
export const formatDateTime = (value) => (value ? dateTimeFmt.format(new Date(value)) : "—");

/** 75 -> "1h 15m", 0.4 -> "<1m" */
export function formatDuration(minutes) {
  if (minutes == null || Number.isNaN(minutes)) return "—";
  if (minutes < 1) return "<1m";
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function relativeTime(value, now) {
  if (!value) return "Never";
  const diff = Math.round((Date.parse(now) - Date.parse(value)) / 1000);
  if (diff < 0) {
    const ahead = Math.abs(diff);
    if (ahead < 60) return `in ${ahead}s`;
    if (ahead < 3600) return `in ${Math.round(ahead / 60)} min`;
    return `in ${Math.round(ahead / 3600)} h`;
  }
  if (diff < 10) return "Just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
  const days = Math.round(diff / 86400);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/* ---- Library-local calendar helpers (dates are "YYYY-MM-DD" keys) ---- */

export const dateKeyOf = (ms) => new Date(ms + OFFSET_MS).toISOString().slice(0, 10);
export const weekdayOf = (ms) => new Date(ms + OFFSET_MS).getUTCDay();
export const hourOfDay = (ms) => new Date(ms + OFFSET_MS).getUTCHours();
export const dayStartMs = (key) => Date.parse(`${key}T00:00:00.000Z`) - OFFSET_MS;
export const addDays = (key, days) => new Date(Date.parse(`${key}T00:00:00.000Z`) + days * DAY).toISOString().slice(0, 10);
export const daysBetween = (startKey, endKey) =>
  Math.round((Date.parse(`${endKey}T00:00:00.000Z`) - Date.parse(`${startKey}T00:00:00.000Z`)) / DAY);
export const formatDateKey = (key) => shortDateFmt.format(new Date(`${key}T12:00:00.000Z`));

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const formatHourLabel = (hour) => {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? "am" : "pm"}`;
};

/** Compare helper used by sortable tables. */
export function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export const initialsOf = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
