"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/app/admin/_components/Sidebar";
import { FeedGate } from "@/app/admin/_components/FeedGate";
import { Header } from "@/app/admin/_components/Header";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SimulationPanel } from "@/components/SimulationPanel";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function AdminShell({ children }) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <div className="tight-corners min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onLogout={() => setConfirmLogout(true)}
      />
      <div className={cn("transition-[padding] duration-200 print:pl-0", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <main id="main" className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 print:p-0">
          <FeedGate>{children}</FeedGate>
        </main>
      </div>
      <SimulationPanel />
      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={async () => {
          setConfirmLogout(false);
          await signOut();
          router.replace("/login");
        }}
        title="Log out of SmartLib?"
        description="You will need to sign in again to open the admin dashboard."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
      />
    </div>
  );
}
