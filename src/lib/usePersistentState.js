"use client";

import { useCallback, useEffect, useState } from "react";

const PREFIX = "smartlib:";

export function usePersistentState(key, initial, isValid = () => true) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return;
      const saved = JSON.parse(raw);
      if (isValid(saved)) setValue(saved);
    } catch {
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next) =>
      setValue((prev) => {
        const v = typeof next === "function" ? next(prev) : next;
        try {
          localStorage.setItem(PREFIX + key, JSON.stringify(v));
        } catch {
        }
        return v;
      }),
    [key],
  );

  return [value, set];
}
