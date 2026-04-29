"use client";

import { useState } from "react";
import { useSimulation } from "@/store/simulationStore";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { formatShortDate, daysUntil } from "@/lib/dateUtils";
import { clsx } from "clsx";
import type { Task } from "@/lib/types";

type FilterStatus = "all" | "open" | "missed" | "completed";
type FilterCategory = "all" | Task["category"];

function priorityColor(p: Task["priority"]) {
  if (p === "high") return "text-red-400";
  if (p === "medium") return "text-amber-400";
  return "text-slate-500";
}

function categoryBadge(c: Task["category"]) {
  const m: Record<Task["category"], { label: string; variant: "info" | "warning" | "positive" | "muted" | "purple" }> = {
    deal: { label: "Deal", variant: "info" },
    fundraising: { label: "Fundraising", variant: "warning" },
    lp_reporting: { label: "LP Reporting", variant: "purple" },
    operations: { label: "Operations", variant: "positive" },
    modeling: { label: "Modeling", variant: "info" },
    admin: { label: "Admin", variant: "muted" },
  };
  const meta = m[c];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export default function TasksPage() {
  const { state, completeTask } = useSimulation();
  const { tasks, currentDate } = state;

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [catFilter, setCatFilter] = useState<FilterCategory>("all");

  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (catFilter !== "all" && t.category !== catFilter) return false;
    return true;
  });

  const open = tasks.filter((t) => t.status === "open");
  const missed = tasks.filter((t) => t.status === "missed");
  const completed = tasks.filter((t) => t.status === "completed");

  const statusFilters: FilterStatus[] = ["all", "open", "missed", "completed"];
  const catFilters: FilterCategory[] = ["all", "deal", "fundraising", "lp_reporting", "operations", "modeling", "admin"];

  const sorted = [...filtered].sort((a, b) => {
    const statusOrder = { missed: 0, open: 1, completed: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    const prioOrder = { high: 0, medium: 1, low: 2 };
    return prioOrder[a.priority] - prioOrder[b.priority];
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Tasks" />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Open" value={open.length} />
          <StatTile label="Missed" value={missed.length} sub={missed.length > 0 ? "Reputation at risk" : "Clean"} trend={missed.length > 0 ? "down" : "neutral"} accent={missed.length === 0} />
          <StatTile label="Completed" value={completed.length} trend="up" />
          <StatTile label="Completion Rate" value={`${tasks.length > 0 ? ((completed.length / tasks.length) * 100).toFixed(0) : 0}%`} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 mr-1">Status:</span>
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                "rounded border px-2.5 py-1 text-xs transition-colors capitalize",
                statusFilter === s
                  ? "border-blue-600 bg-blue-900/40 text-blue-300"
                  : "border-[#1e2d4a] text-slate-400 hover:text-slate-200"
              )}
            >
              {s}
            </button>
          ))}
          <span className="text-[10px] uppercase tracking-wider text-slate-500 ml-3 mr-1">Category:</span>
          {catFilters.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={clsx(
                "rounded border px-2.5 py-1 text-xs transition-colors capitalize",
                catFilter === c
                  ? "border-blue-600 bg-blue-900/40 text-blue-300"
                  : "border-[#1e2d4a] text-slate-400 hover:text-slate-200"
              )}
            >
              {c.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {sorted.length === 0 && (
            <p className="text-sm text-slate-500 py-8 text-center">No tasks match the selected filters.</p>
          )}
          {sorted.map((task) => {
            const days = daysUntil(currentDate, task.dueDate);
            const overdue = task.status === "open" && days < 0;
            const urgent = task.status === "open" && days >= 0 && days <= 5;

            return (
              <div
                key={task.id}
                className={clsx(
                  "flex items-start gap-3 rounded border px-4 py-3",
                  task.status === "missed" && "border-red-900/50 bg-red-950/20",
                  task.status === "completed" && "border-[#1a2540] bg-[#090e1c] opacity-60",
                  (task.status === "open" && !overdue && !urgent) && "border-[#1a2540] bg-[#0a1020]",
                  urgent && "border-amber-900/50 bg-amber-950/10",
                  overdue && "border-red-900/40 bg-red-950/10"
                )}
              >
                {/* Priority dot */}
                <span className={clsx("mt-1 h-2 w-2 flex-shrink-0 rounded-full", priorityColor(task.priority).replace("text-", "bg-"))} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx("font-semibold text-sm", task.status === "missed" ? "text-red-300" : task.status === "completed" ? "text-slate-500 line-through" : "text-slate-200")}>
                      {task.title}
                    </span>
                    {categoryBadge(task.category)}
                    {task.status === "missed" && <Badge variant="negative">Missed</Badge>}
                    {task.status === "completed" && <Badge variant="positive">Done</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{task.description}</p>
                  <p className={clsx("mt-1.5 text-[11px]", task.status === "missed" ? "text-red-400" : urgent ? "text-amber-400" : "text-slate-500")}>
                    Due {formatShortDate(task.dueDate)}
                    {task.status === "open" && ` · ${days >= 0 ? `${days}d remaining` : `${Math.abs(days)}d overdue`}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={clsx("text-[11px] font-medium uppercase", priorityColor(task.priority))}>
                    {task.priority}
                  </span>
                  {task.status === "open" && (
                    <Button size="sm" variant="success" onClick={() => completeTask(task.id)}>
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
