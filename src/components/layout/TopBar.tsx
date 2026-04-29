"use client";

import { useSimulation } from "@/store/simulationStore";
import { Button } from "@/components/ui/Button";
import { formatSimDate, addDays, formatShortDate } from "@/lib/dateUtils";
import { clsx } from "clsx";

/** Returns the next deadline date across open tasks + deal process deadlines, or null if none. */
function computeNextDeadline(state: ReturnType<typeof useSimulation>["state"]): string | null {
  const taskDates = state.tasks
    .filter((t) => t.status === "open" && t.dueDate > state.currentDate)
    .map((t) => t.dueDate);
  const dealDates = state.deals
    .filter((d) => d.processDeadline && d.processDeadline > state.currentDate)
    .map((d) => d.processDeadline!);
  const all = [...taskDates, ...dealDates].sort();
  return all[0] ?? null;
}

/** Returns the next high-priority deadline (high-priority task or deal process). */
function computeNextMajorEvent(state: ReturnType<typeof useSimulation>["state"]): string | null {
  const highTaskDates = state.tasks
    .filter((t) => t.status === "open" && t.priority === "high" && t.dueDate > state.currentDate)
    .map((t) => t.dueDate);
  const dealDates = state.deals
    .filter((d) => d.processDeadline && d.processDeadline > state.currentDate)
    .map((d) => d.processDeadline!);
  const all = [...highTaskDates, ...dealDates].sort();
  return all[0] ?? null;
}

/** Count tasks that would be missed if time advanced to targetDate. */
function countWouldMiss(state: ReturnType<typeof useSimulation>["state"], targetDate: string): number {
  return state.tasks.filter(
    (t) => t.status === "open" && t.dueDate <= targetDate && t.dueDate > state.currentDate
  ).length;
}

interface AdvanceButtonProps {
  label: string;
  targetDate: string;
  wouldMiss: number;
  variant?: "secondary" | "ghost" | "primary";
  onClick: () => void;
}

function AdvanceButton({ label, targetDate, wouldMiss, variant = "secondary", onClick }: AdvanceButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "group relative flex flex-col items-center rounded border px-3 py-1 transition-colors min-w-[72px]",
        variant === "primary"
          ? "border-blue-600 bg-blue-600 hover:bg-blue-500 text-white"
          : variant === "ghost"
          ? "border-transparent hover:border-[#2d4270] hover:bg-[#1a2540] text-slate-300"
          : "border-[#2d4270] bg-[#1a2540] hover:bg-[#1e2d4a] text-slate-200"
      )}
    >
      <span className="text-[11px] font-semibold leading-tight">{label}</span>
      <span className={clsx(
        "text-[9px] leading-tight mt-0.5 font-mono",
        variant === "primary" ? "text-blue-200" : "text-slate-500"
      )}>
        {targetDate}
      </span>
      {wouldMiss > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow">
          {wouldMiss}
        </span>
      )}
    </button>
  );
}

export function TopBar({ title }: { title?: string }) {
  const { state, advanceDays, advanceToNextDeadline, advanceToNextMajorEvent } = useSimulation();

  const plus1 = addDays(state.currentDate, 1);
  const plus7 = addDays(state.currentDate, 7);
  const nextDeadline = computeNextDeadline(state);
  const nextMajor = computeNextMajorEvent(state);

  const miss1 = countWouldMiss(state, plus1);
  const miss7 = countWouldMiss(state, plus7);
  const missDeadline = nextDeadline ? countWouldMiss(state, nextDeadline) : 0;
  const missMajor = nextMajor ? countWouldMiss(state, nextMajor) : 0;

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#1e2d4a] bg-[#080d1c] px-6">
      {/* Left: page title + current sim date */}
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-sm font-semibold text-slate-200">{title}</h1>
        )}
        <div className="flex items-center gap-2 rounded border border-[#1e2d4a] bg-[#0d1528] px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-600 leading-none mb-0.5">Sim Date</p>
            <p className="text-xs font-mono font-semibold text-slate-200 leading-none">
              {formatSimDate(state.currentDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Right: advance controls */}
      <div className="flex items-center gap-1.5">
        <span className="mr-1.5 text-[9px] font-semibold uppercase tracking-widest text-slate-600">
          Advance Time
        </span>

        <AdvanceButton
          label="+1 Day"
          targetDate={formatShortDate(plus1)}
          wouldMiss={miss1}
          variant="secondary"
          onClick={() => advanceDays(1)}
        />
        <AdvanceButton
          label="+1 Week"
          targetDate={formatShortDate(plus7)}
          wouldMiss={miss7}
          variant="secondary"
          onClick={() => advanceDays(7)}
        />
        <AdvanceButton
          label="→ Deadline"
          targetDate={nextDeadline ? formatShortDate(nextDeadline) : "none"}
          wouldMiss={missDeadline}
          variant="ghost"
          onClick={advanceToNextDeadline}
        />
        <AdvanceButton
          label="→ Major Event"
          targetDate={nextMajor ? formatShortDate(nextMajor) : "none"}
          wouldMiss={missMajor}
          variant="primary"
          onClick={advanceToNextMajorEvent}
        />
      </div>
    </header>
  );
}
