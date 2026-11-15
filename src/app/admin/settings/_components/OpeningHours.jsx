"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { useLibrary } from "@/context/LibraryContext";
import { ALL_DAY, DEFAULT_DAY, is24h, validateHours } from "@/lib/hours";

function useDraft(saved) {
  const [draft, setDraft] = useState(saved);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  return { draft, setDraft, dirty, reset: () => setDraft(saved) };
}

function SettingsSection({ title, description, dirty, onSave, onCancel, children }) {
  return (
    <Card>
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} noValidate>
        <CardHeader title={title} description={description} />
        <CardBody className="space-y-5">{children}</CardBody>
        <div className="flex items-center justify-end gap-2 border-t border-line bg-cream-50 px-5 py-3 rounded-b-xl">
          {dirty && <span className="mr-auto text-xs font-medium text-warn-700">Unsaved changes</span>}
          <Button type="button" onClick={onCancel} disabled={!dirty}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!dirty}>Save changes</Button>
        </div>
      </form>
    </Card>
  );
}

const WEEK = [1, 2, 3, 4, 5, 6, 0];

const Check = ({ checked, disabled, onChange, children }) => (
  <label className={`inline-flex items-center gap-2 text-sm ${disabled ? "text-muted" : "text-ink"}`}>
    <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-brand-600" />
    {children}
  </label>
);

export function OpeningHours() {
  const { operatingHours, updateOperatingHours, notify } = useLibrary();
  const { draft, setDraft, dirty, reset } = useDraft(operatingHours);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");

  const setDay = (day, change) => {
    setErrors((e) => ({ ...e, [day]: undefined }));
    setDraft((d) => d.map((h) => (h.day === day ? { ...h, ...change } : h)));
  };
  const copyMonday = () => {
    const mon = draft.find((h) => h.day === 1);
    setErrors({});
    setDraft((d) => d.map((h) => (h.day >= 1 && h.day <= 5 ? { ...h, open: mon.open, close: mon.close, closed: mon.closed } : h)));
  };
  const save = async () => {
    const found = validateHours(draft);
    if (found) return setErrors(found);
    setSaveError("");
    const result = await updateOperatingHours(draft);
    if (result?.ok === false) return setSaveError(result.error);
    notify("Opening hours saved.");
  };

  return (
    <SettingsSection
      title="Opening hours"
      description="Analytics and the student page only count time when the library is open."
      dirty={dirty}
      onSave={save}
      onCancel={() => { reset(); setErrors({}); setSaveError(""); }}
    >
      <div className="divide-y divide-line">
        {WEEK.map((day) => {
          const h = draft.find((x) => x.day === day);
          if (!h) return null;
          const allDay = is24h(h);
          return (
            <div key={day} className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 first:pt-0">
              <span className="w-24 text-sm font-semibold text-ink">{h.label}</span>
              <Check checked={h.closed} onChange={(v) => setDay(day, { closed: v })}>Closed</Check>
              <Check checked={allDay} disabled={h.closed} onChange={(v) => setDay(day, v ? ALL_DAY : DEFAULT_DAY)}>24 hours</Check>
              {h.closed ? (
                <span className="text-sm text-muted">Closed all day</span>
              ) : allDay ? (
                <span className="text-sm text-muted">Open all day</span>
              ) : (
                <span className="flex items-center gap-2">
                  <Input type="time" aria-label={`${h.label} opening time`} value={h.open} error={errors[day]} className="w-32" onChange={(e) => setDay(day, { open: e.target.value })} />
                  <span className="text-sm text-muted">to</span>
                  <Input type="time" aria-label={`${h.label} closing time`} value={h.close === "24:00" ? "23:59" : h.close} error={errors[day]} className="w-32" onChange={(e) => setDay(day, { close: e.target.value })} />
                </span>
              )}
              {errors[day] && <p role="alert" className="basis-full text-xs font-medium text-brand-700">{errors[day]}</p>}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={copyMonday}>Copy Monday to weekdays</Button>
        {(saveError || errors.all) && <p role="alert" className="text-xs font-medium text-brand-700">{saveError || errors.all}</p>}
      </div>
    </SettingsSection>
  );
}
