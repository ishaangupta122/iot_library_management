import Link from "next/link";
import { ArrowRight, GraduationCap, LayoutDashboard, LibraryBig, MonitorSmartphone } from "lucide-react";

export const metadata = { title: "SmartLib" };

const INTERFACES = [
  { href: "/student", audience: "For students", title: "Student Website", description: "See which seats are free right now and the best times to visit.", icon: GraduationCap },
  { href: "/kiosk", audience: "For the library entrance", title: "Reservation Kiosk", description: "Tap a free seat and your ID card to hold it for 5 minutes.", icon: MonitorSmartphone },
  { href: "/admin", audience: "For library staff", title: "Admin Dashboard", description: "Monitor seats and sensors, reservations and usage.", icon: LayoutDashboard },
];

// Launcher for the three interfaces. They all share the same live seat data.
export default function HomePage() {
  return (
    <div className="tight-corners flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-10 flex items-center gap-4 sm:gap-5">
          <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white sm:h-16 sm:w-16"><LibraryBig className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" /></span>
          <div>
            <h1 className="font-display text-4xl leading-[0.9] font-semibold tracking-tight sm:text-5xl">SmartLib</h1>
            <p className="mt-1.5 text-sm leading-none text-muted sm:text-base">Smart library seat management</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {INTERFACES.map(({ href, audience, title, description, icon: Icon }) => (
            <Link key={href} href={href} className="group flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-card transition-colors hover:border-brand-700/50">
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon size={22} aria-hidden="true" /></span>
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">{audience}</p>
              <h2 className="mt-1 font-display text-xl font-medium">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                Open <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </main>
      <footer className="px-6 pb-5 text-center text-sm text-muted">Central Library · SmartLib</footer>
    </div>
  );
}
