import { clsx } from "clsx";

interface StatTileProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  accent?: boolean;
  className?: string;
}

export function StatTile({ label, value, sub, trend, accent, className }: StatTileProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border bg-[#0d1528] p-4",
        accent ? "border-blue-800/60" : "border-[#1e2d4a]",
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={clsx("mt-1 text-2xl font-bold tracking-tight", accent ? "text-blue-400" : "text-slate-100")}>
        {value}
      </p>
      {sub && (
        <p
          className={clsx(
            "mt-0.5 text-xs",
            trend === "up" && "text-emerald-400",
            trend === "down" && "text-red-400",
            (!trend || trend === "neutral") && "text-slate-500"
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
