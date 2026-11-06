"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/Form";
import { useLibrary } from "@/context/LibraryContext";
import { SettingsSection } from "./SettingsSection";
import { useDraft } from "./useDraft";

/** How long a sensor can stay silent before its seat is shown as Unavailable. */
export function SensorTimeout() {
  const { settings, updateSettings, notify } = useLibrary();
  const { draft, setDraft, dirty, reset } = useDraft(settings.sensors);
  const [error, setError] = useState("");

  const save = async () => {
    const seconds = draft.timeoutSeconds;
    if (!Number.isInteger(seconds) || seconds < 30 || seconds > 600) return setError("Enter a whole number from 30 to 600.");
    setError("");
    const result = await updateSettings("sensors", { timeoutSeconds: seconds });
    if (result?.ok === false) return setError(result.error);
    notify("Sensor timeout saved.");
  };

  return (
    <SettingsSection
      title="Sensor timeout"
      description="If a sensor sends nothing for this long, its seat shows as Unavailable instead of Available."
      dirty={dirty}
      onSave={save}
      onCancel={() => { reset(); setError(""); }}
    >
      <Field label="Timeout (seconds)" required error={error} hint="Default is 120. Too low and brief wifi drops mark seats unavailable; too high and a dead sensor keeps showing an old status.">
        {(p) => (
          <Input
            {...p}
            type="number"
            min={30}
            max={600}
            error={error}
            className="max-w-48"
            value={draft.timeoutSeconds}
            onChange={(e) => { setError(""); setDraft({ timeoutSeconds: e.target.value === "" ? "" : Number(e.target.value) }); }}
          />
        )}
      </Field>
    </SettingsSection>
  );
}
