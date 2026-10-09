import { Radio } from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden bg-linear-to-r from-blue-600 to-blue-500 rounded-2xl shadow-sm px-8 py-7 flex items-center justify-between">
      {/* Decorative blobs */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
      <div className="absolute -bottom-10 right-20 w-28 h-28 bg-white/5 rounded-full" />

      <div className="relative">
        <h1 className="text-2xl font-bold text-white mb-1">
          {getGreeting()} 👋
        </h1>
        <p className="text-blue-100 text-sm">
          Find an available seat for your next study session.
        </p>
      </div>
    </div>
  );
}
