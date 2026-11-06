import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <section className={cn("rounded-xl border border-line bg-surface shadow-card", className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
