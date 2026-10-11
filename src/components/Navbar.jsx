import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, ShieldCheck } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Home", icon: BookOpen },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard size={16} color="white" strokeWidth={2} />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            SmartLib
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}>
                <Icon size={14} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right — notifications + user */}
        {/* <div className="flex items-center gap-3">
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} strokeWidth={1.8} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">AJ</span>
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold text-gray-900">Alex Johnson</p>
              <p className="text-xs text-gray-400">Student</p>
            </div>
          </div>
        </div> */}
      </div>
    </header>
  );
}
