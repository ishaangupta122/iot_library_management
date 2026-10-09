/** Analytics data for the admin dashboard */

export const PEAK_HOURS = [
  { hour: "8 AM",  students: 12 },
  { hour: "9 AM",  students: 28 },
  { hour: "10 AM", students: 45 },
  { hour: "11 AM", students: 60 },
  { hour: "12 PM", students: 38 },
  { hour: "1 PM",  students: 55 },
  { hour: "2 PM",  students: 70 },
  { hour: "3 PM",  students: 85 },
  { hour: "4 PM",  students: 72 },
  { hour: "5 PM",  students: 50 },
  { hour: "6 PM",  students: 30 },
  { hour: "7 PM",  students: 18 },
];

export const WEEKLY_OCCUPANCY = [
  { day: "Mon", pct: 40 },
  { day: "Tue", pct: 55 },
  { day: "Wed", pct: 60 },
  { day: "Thu", pct: 80 },
  { day: "Fri", pct: 70 },
  { day: "Sat", pct: 45 },
  { day: "Sun", pct: 30 },
];

export const OCCUPANCY_BREAKDOWN = [
  { name: "Available", value: 2, fill: "#34d399" },
  { name: "Occupied",  value: 2, fill: "#f87171" },
];

export const ZONE_STATS = [
  { zone: "Zone A – Reading", avgTime: "2h 14m", sessions: 142, maxSessions: 220 },
  { zone: "Zone B – Group",   avgTime: "1h 45m", sessions: 98,  maxSessions: 220 },
  { zone: "Zone C – Silent",  avgTime: "3h 02m", sessions: 211, maxSessions: 220 },
];

export const KPI_CARDS = [
  { label: "Total Seats",        value: "4",      sub: "across 3 zones",  accent: "text-gray-900"  },
  { label: "Currently Occupied", value: "2",      sub: "50% utilisation", accent: "text-red-500"   },
  { label: "Avg. Session Time",  value: "2h 08m", sub: "last 7 days",     accent: "text-blue-600"  },
  { label: "Peak Hour Today",    value: "3 PM",   sub: "85% full",        accent: "text-amber-500" },
];
