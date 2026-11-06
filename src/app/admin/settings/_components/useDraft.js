import { useState } from "react";

/** Local editable copy of saved settings with dirty tracking and reset. */
export function useDraft(saved) {
  const [draft, setDraft] = useState(saved);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  return { draft, setDraft, dirty, reset: () => setDraft(saved) };
}
