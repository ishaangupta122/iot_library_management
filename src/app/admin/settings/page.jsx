"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { SensorList } from "./_components/SensorList";
import { SensorTimeout } from "./_components/SensorTimeout";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Sensor configuration." />
      <div className="max-w-4xl space-y-6">
        <SensorTimeout />
        <SensorList />
      </div>
    </>
  );
}
