"use client";

import { clsx } from "clsx";
import { useSimulation } from "@/store/simulationStore";
import { formatSimDate, formatShortDate, addDays, daysUntil } from "@/lib/dateUtils";
import type { Task } from "@/lib/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function computeNextDeadline(state: ReturnType<typeof useSimulation>["state"]) {
  const taskDates = state.tasks
    .filter((t) => t.status === "open" && t.dueDate > state.currentDate)
    .map((t) => ({ date: t.dueDate, label: t.title, type: "task" as const, priority: t.priority }));
  const dealDates = state.deals
    .filter((d) => d.processDeadline && d.processDeadline > state.currentDate)
    .map((d) => ({ date: d.processDeadline!, label: `${d.companyName} process`, type: "deal" as const, priority: "high" as const }));
  return [...taskDates, ...dealDates].sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
}

function computeNextMajorEvent(state: ReturnType<typeof useSimulation>["state"]) {
  const highTaskDates = state.tasks
    .filter((t) => t.status === "open" && t.priority === "high" && t.dueDate > state.currentDate)
    .map((t) => ({ date: t.dueDate, label: t.title }));
  const dealDates = state.deals
    .filter((d) => d.processDeadline && d.processDeadline > state.currentDate)
    .map((d) => ({ date: d.processDeadline!, label: `${d.companyName} process` }));
  return [...highTaskDates, ...dealDates].sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
}

function tasksWouldMiss(
  state: ReturnType<typeof useSimulation>["state"],
  targetDate: string
): Task[] {
  return state.tasks.filter(
    (t) => t.status === "open" && t.dueDate <= targetDate && t.dueDate > state.currentDate
  );
}

function urgencyColor(days: number) {
  if (days <= 1) return "text-red-400";
  if (days <= 4) return "text-orange-400";
  if (days <= 7) return "text-amber-400";
  return "text-slate-400";
}

function urgencyBarColor(days: number) {
  if (days <= 1) return "bg-red-500";
  if (days <= 4) return "bg-orange-500";
  if (days <= 7) return "bg-amber-500";
  return "bg-blue-500";
}

// ─── Preview chip ─────────────────────────────────────────────────────────────

function MissPreview({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return (
    <span className="text-[10px] text-emerald-500 font-medium">✓ No deadlines crossed</span>
  );
  return (
    <span className="text-[10px] text-red-400 font-medium">
      ⚠ {tasks.length} deadline{tasks.length !== 1 ? "s" : ""} will be missed
    </span>
  );
}

// ─── Individual action button ─────────────────────────────────────────────────

interface ActionCardProps {
  label: string;
  shortcut: string;
  targetDate: string;
  targetLabel?: string;
  wouldMiss: Task[];
  variant: "primary" | "secondary" | "ghost";
  onClick: () => void;
}

function ActionCard({ label, shortcut, targetDate, targetLabel, wouldMiss, variant, onClick }: ActionCardProps) {
  const hasWarning = wouldMiss.length > 0;

  return (
    <button
      onClick={onClick}
      className={clsx(
        "group relative w-full flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-all hover:scale-[1.01]",
        variant === "primary"
          ? "border-blue-700/80 bg-blue-900/30 hover:bg-blue-900/50 hover:border-blue-600"
          : variant === "secondary"
          ? "border-[#1e2d4a] bg-[#0a1020] hover:bg-[#0d1830] hover:border-[#2d4270]"
          : "border-[#1a2540] bg-transparent hover:bg-[#0a1020] hover:border-[#2d4270]"
      )}
    >
      {/* Warning badge */}
      {hasWarning && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-lg">
          {wouldMiss.length}
        </span>
      )}

      <div className="flex items-center justify-between w-full mb-1">
        <span className={clsx(
          "text-[11px] font-bold uppercase tracking-wide",
          variant === "primary" ? "text-blue-300" : "text-slate-300"
        )}>
          {label}
        </span>
        <span className={clsx(
          "text-[9px] font-mono rounded px-1 py-0.5",
          variant === "primary" ? "bg-blue-800/60 text-blue-400" : "bg-[#1a2540] text-slate-500"
        )}>
          {shortcut}
        </span>
      </div>

      <p className={clsx(
        "text-xs font-mono font-semibold",
        variant === "primary" ? "text-blue-200" : "text-slate-200"
      )}>
        → {targetDate}
      </p>

      {targetLabel && (
        <p className="text-[10px] text-slate-500 mt-0.5 truncate w-full">{targetLabel}</p>
      )}

      <div className="mt-1.5">
        <MissPreview tasks={wouldMiss} />
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SimClock() {
  const { state, advanceDays, advanceToNextDeadline, advanceToNextMajorEvent } = useSimulation();
  const { currentDate, tasks } = state;

  const plus1 = addDays(currentDate, 1);
  const plus7 = addDays(currentDate, 7);
  const nextDeadlineItem = computeNextDeadline(state);
  const nextMajorItem = computeNextMajorEvent(state);

  const miss1 = tasksWouldMiss(state, plus1);
  const miss7 = tasksWouldMiss(state, plus7);
  const missDeadline = nextDeadlineItem ? tasksWouldMiss(state, nextDeadlineItem.date) : [];
  const missMajor = nextMajorItem ? tasksWouldMiss(state, nextMajorItem.date) : [];

  // The 4 sample deadline tasks (+ other near-term open tasks), sorted by due date
  const upcomingTasks = tasks
    .filter((t) => t.status === "open" && t.dueDate >= currentDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8);

  const openCount = tasks.filter((t) => t.status === "open").length;
  const missedCount = tasks.filter((t) => t.status === "missed").length;

  return (
    <div className="rounded-xl border border-[#1e2d4a] bg-[#0a0f1e] overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center justify-between border-b border-[#1e2d4a] bg-[#070c1a] px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Simulation Time
            </span>
          </div>
          <div className="h-4 w-px bg-[#1e2d4a]" />
          <span className="text-[10px] text-slate-600">
            Player-controlled · real-world time passing has no effect
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-slate-500">
            <span className="font-bold text-slate-300">{openCount}</span> open tasks
          </span>
          {missedCount > 0 && (
            <span className="rounded border border-red-800 bg-red-950/40 px-2 py-0.5 text-red-400 font-semibold">
              {missedCount} missed
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-0">
        {/* ── Left: current date + task status ──────────────────────────── */}
        <div className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-[#1e2d4a] px-5 py-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Current Date</p>
            <p className="text-2xl font-black text-slate-100 leading-tight tabular-nums">
              {formatSimDate(currentDate)}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Open tasks</span>
              <span className="font-bold text-slate-200">{openCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Missed tasks</span>
              <span className={clsx("font-bold", missedCount > 0 ? "text-red-400" : "text-emerald-400")}>
                {missedCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Reputation</span>
              <span className={clsx(
                "font-bold",
                state.reputationScore >= 70 ? "text-emerald-400" :
                state.reputationScore >= 40 ? "text-amber-400" : "text-red-400"
              )}>
                {state.reputationScore} / 100
              </span>
            </div>
          </div>

          {/* Core mechanic reminder */}
          <div className="mt-4 rounded border border-blue-900/40 bg-blue-950/20 px-3 py-2">
            <p className="text-[10px] leading-relaxed text-blue-400/80">
              Penalties only trigger when you manually advance time past a deadline — never from real-world time passing.
            </p>
          </div>
        </div>

        {/* ── Center: advance controls ───────────────────────────────────── */}
        <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-[#1e2d4a] px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">Advance Time</p>
          <div className="grid grid-cols-2 gap-2">
            <ActionCard
              label="+1 Day"
              shortcut="D"
              targetDate={formatShortDate(plus1)}
              wouldMiss={miss1}
              variant="secondary"
              onClick={() => advanceDays(1)}
            />
            <ActionCard
              label="+1 Week"
              shortcut="W"
              targetDate={formatShortDate(plus7)}
              wouldMiss={miss7}
              variant="secondary"
              onClick={() => advanceDays(7)}
            />
            <ActionCard
              label="→ Deadline"
              shortcut="L"
              targetDate={nextDeadlineItem ? formatShortDate(nextDeadlineItem.date) : "—"}
              targetLabel={nextDeadlineItem?.label}
              wouldMiss={missDeadline}
              variant="ghost"
              onClick={advanceToNextDeadline}
            />
            <ActionCard
              label="→ Major Event"
              shortcut="M"
              targetDate={nextMajorItem ? formatShortDate(nextMajorItem.date) : "—"}
              targetLabel={nextMajorItem?.label}
              wouldMiss={missMajor}
              variant="primary"
              onClick={advanceToNextMajorEvent}
            />
          </div>
          <p className="mt-2 text-[10px] text-slate-600">
            Red badge = tasks that will be missed if you advance to that date.
          </p>
        </div>

        {/* ── Right: upcoming deadlines timeline ────────────────────────── */}
        <div className="col-span-12 md:col-span-5 px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">
            Upcoming Deadlines
          </p>
          <div className="space-y-2">
            {upcomingTasks.length === 0 && (
              <p className="text-xs text-slate-600 py-2">No open upcoming tasks.</p>
            )}
            {upcomingTasks.map((task) => {
              const days = daysUntil(currentDate, task.dueDate);
              const maxDays = 30;
              const barPct = Math.max(5, 100 - Math.min(100, (days / maxDays) * 100));

              return (
                <div key={task.id} className="group">
                  <div className="flex items-start gap-2">
                    {/* priority dot */}
                    <span className={clsx(
                      "mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full",
                      task.priority === "high" ? "bg-red-400" :
                      task.priority === "medium" ? "bg-amber-400" : "bg-slate-600"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-300 truncate">{task.title}</span>
                        <span className={clsx("text-[11px] font-mono flex-shrink-0 font-semibold", urgencyColor(days))}>
                          {days === 0 ? "TODAY" : days === 1 ? "1d" : `${days}d`}
                        </span>
                      </div>
                      {/* Urgency bar */}
                      <div className="mt-0.5 h-0.5 w-full rounded-full bg-[#1a2540]">
                        <div
                          className={clsx("h-0.5 rounded-full transition-all", urgencyBarColor(days))}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-600 mt-0.5">{formatShortDate(task.dueDate)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
