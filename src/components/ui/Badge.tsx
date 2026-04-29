import { clsx } from "clsx";

type BadgeVariant =
  | "default"
  | "positive"
  | "negative"
  | "warning"
  | "info"
  | "muted"
  | "purple";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-700 text-slate-200",
  positive: "bg-emerald-900/60 text-emerald-400 border border-emerald-800",
  negative: "bg-red-900/60 text-red-400 border border-red-800",
  warning: "bg-amber-900/60 text-amber-400 border border-amber-800",
  info: "bg-blue-900/60 text-blue-400 border border-blue-800",
  muted: "bg-slate-800 text-slate-400",
  purple: "bg-purple-900/60 text-purple-400 border border-purple-800",
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
