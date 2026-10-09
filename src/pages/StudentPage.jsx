import WelcomeBanner from "../components/WelcomeBanner";
import StatsCards    from "../components/StatsCards";
import SeatLayout    from "../components/SeatLayout";
import { SEATS }     from "../data/seats";

export default function StudentPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <WelcomeBanner />
      <StatsCards seats={SEATS} />
      <SeatLayout seats={SEATS} />
    </main>
  );
}
