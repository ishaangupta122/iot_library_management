"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { OpeningHours } from "./_components/OpeningHours";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Library configuration." />
      <div className="max-w-4xl space-y-6">
        <OpeningHours />
      </div>
    </>
  );
}
