"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Click-outside / Escape dismissible dropdown. `trigger` receives { open, toggle, props }. */
export function Popover({ trigger, children, align = "right", width = "w-80", label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o), props: { "aria-haspopup": "true", "aria-expanded": open } })}
      {open && (
        <div
          role="region"
          aria-label={label}
          className={cn("reset-focus absolute top-full z-40 mt-2 text-ink max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface shadow-pop", width, align === "right" ? "right-0" : "left-0")}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}
