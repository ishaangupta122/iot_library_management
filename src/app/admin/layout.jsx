import { AdminGuard } from "@/app/admin/_components/AdminGuard";
import { AdminShell } from "@/app/admin/_components/AdminShell";

export const metadata = { title: "Admin Dashboard · SmartLib" };

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
