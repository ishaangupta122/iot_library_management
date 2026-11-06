import Link from "next/link";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-card border border-brand-600 hover:border-brand-700",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-cream-50 hover:border-ink-soft/40",
  ghost: "text-ink-soft hover:bg-cream-200 border border-transparent",
  danger: "bg-surface text-brand-700 border border-brand-200 hover:bg-brand-50",
};
const SIZES = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  icon: "h-9 w-9 justify-center",
  lg: "h-16 px-8 text-xl gap-3 rounded-2xl",
};

export function Button({ variant = "secondary", size = "md", href, className, children, ...props }) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
