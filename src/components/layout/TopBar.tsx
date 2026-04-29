"use client";

import { useSimulation } from "@/store/simulationStore";
import { Button } from "@/components/ui/Button";
import { formatSimDate } from "@/lib/dateUtils";

export function TopBar({ title }: { title?: string }) {
  const { state, advanceDays, advanceToNextDeadline, advanceToNextMajorEvent } = useSimulation();

  return (
    <header className="flex h-12 items-center justify-between border-b border-[#1e2d4a] bg-[#080d1c] px-6">
      <div className="flex items-center gap-3">
        {title && <h1 className="text-sm font-semibold text-slate-200">{title}</h1>}
        <div className="flex items-center gap-1.5 rounded border border-[#1e2d4a] bg-[#0d1528] px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-slate-300">{formatSimDate(state.currentDate)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="mr-1 text-[10px] uppercase tracking-wider text-slate-500">Advance</span>
        <Button size="sm" variant="secondary" onClick={() => advanceDays(1)}>
          +1 Day
        </Button>
        <Button size="sm" variant="secondary" onClick={() => advanceDays(7)}>
          +1 Week
        </Button>
        <Button size="sm" variant="ghost" onClick={advanceToNextDeadline}>
          → Deadline
        </Button>
        <Button size="sm" variant="primary" onClick={advanceToNextMajorEvent}>
          → Major Event
        </Button>
      </div>
    </header>
  );
}
