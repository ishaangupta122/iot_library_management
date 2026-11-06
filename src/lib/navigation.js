import { BarChart3, CalendarClock, LayoutDashboard, Radio, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/monitoring", label: "Live Monitoring", icon: Radio },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarClock },
  { href: "/admin/analytics", label: "Usage Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function findNavItem(pathname) {
  return NAV_ITEMS.find((item) => item.href === pathname) ?? NAV_ITEMS[0];
}
