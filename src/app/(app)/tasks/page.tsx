"use client";

import { useState } from "react";
import { useSimulation } from "@/store/simulationStore";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { formatShortDate, daysUntil, addDays } from "@/lib/dateUtils";
import { clsx } from "clsx";
import type { Task } from "@/lib/types";

type FilterStatus = "all" | "open" | "missed" | "completed";
type FilterCategory = "all" | Task["category"];

function priorityBg(p: Task["priority"]) {
  if (p === "high") return "bg-red-400";
  if (p === "medium") return "bg-amber-400";
  return "bg-slate-500";
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

const CATEGORIES: Task["category"][] = ["deal", "fundraising", "lp_reporting", "operations", "modeling", "admin"];
const PRIORITIES: Task["priority"][] = ["high", "medium", "low"];

export default function TasksPage() {
  const { state, completeTask, addTask } = useSimulation();
  const { tasks, currentDate } = state;

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [catFilter, setCatFilter] = useState<FilterCategory>("all");
  const [showAddForm, setShowAddForm] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<Task["category"]>("deal");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [newDueDays, setNewDueDays] = useState(7);

  const open = tasks.filter((t) => t.status === "open");
  const missed = tasks.filter((t) => t.status === "missed");
  const completed = tasks.filter((t) => t.status === "completed");

  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (catFilter !== "all" && t.category !== catFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const sOrder = { missed: 0, open: 1, completed: 2 };
    if (sOrder[a.status] !== sOrder[b.status]) return sOrder[a.status] - sOrder[b.status];
    const pOrder = { high: 0, medium: 1, low: 2 };
    return pOrder[a.priority] - pOrder[b.priority];
  });

  function handleAddTask() {
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      priority: newPriority,
      dueDate: addDays(currentDate, newDueDays),
    });
    setNewTitle("");
    setNewDesc("");
    setNewCategory("deal");
    setNewPriority("medium");
    setNewDueDays(7);
    setShowAddForm(false);
  }

  const statusFilters: FilterStatus[] = ["all", "open", "missed", "completed"];
  const catFilters: FilterCategory[] = ["all", ...CATEGORIES];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Tasks" />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Open" value={open.length} />
          <StatTile
            label="Missed"
            value={missed.length}
            sub={missed.length > 0 ? "Reputation at risk" : "Clean slate"}
            trend={missed.length > 0 ? "down" : "neutral"}
            accent={missed.length === 0}
          />
          <StatTile label="Completed" value={completed.length} trend="up" />
          <StatTile
            label="Completion Rate"
            value={`${tasks.length > 0 ? ((completed.length / tasks.length) * 100).toFixed(0) : 0}%`}
          />
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Status:</span>
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
            <span className="text-[10px] uppercase tracking-wider text-slate-500 ml-2">Category:</span>
            {catFilters.map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={clsx(
                  "rounded border px-2.5 py-1 text-xs transition-colors",
                  catFilter === c
                    ? "border-blue-600 bg-blue-900/40 text-blue-300"
                    : "border-[#1e2d4a] text-slate-400 hover:text-slate-200"
                )}
              >
                {c.replace("_", " ")}
              </button>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "✕ Cancel" : "+ Add Task"}
          </Button>
        </div>

        {/* Add task form */}
        {showAddForm && (
          <Card className="border-blue-900/40 bg-blue-950/10">
            <CardHeader>
              <CardTitle>New Task</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task title"
                  className="w-full rounded border border-[#1a2540] bg-[#070c1a] px-2.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-700"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional details..."
                  className="w-full rounded border border-[#1a2540] bg-[#070c1a] px-2.5 py-2 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-blue-700"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Task["category"])}
                  className="w-full rounded border border-[#1a2540] bg-[#070c1a] px-2.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-700"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Task["priority"])}
                  className="w-full rounded border border-[#1a2540] bg-[#070c1a] px-2.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-700"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">
                  Due In (days from today) — {addDays(currentDate, newDueDays)}
                </label>
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={newDueDays}
                  onChange={(e) => setNewDueDays(parseInt(e.target.value))}
                  className="w-full h-1.5 appearance-none rounded-full bg-[#1a2540] accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>1d</span><span className="font-semibold text-slate-300">{newDueDays}d</span><span>60d</span>
                </div>
              </div>
              <div className="flex items-end">
                <Button variant="primary" size="md" onClick={handleAddTask} disabled={!newTitle.trim()} className="w-full">
                  Create Task
                </Button>
              </div>
            </div>
          </Card>
        )}

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
                  "flex items-start gap-3 rounded border px-4 py-3 transition-colors",
                  task.status === "missed" && "border-red-900/50 bg-red-950/20",
                  task.status === "completed" && "border-[#1a2540] bg-[#090e1c] opacity-50",
                  task.status === "open" && !overdue && !urgent && "border-[#1a2540] bg-[#0a1020]",
                  urgent && "border-amber-900/50 bg-amber-950/10",
                  overdue && "border-red-900/40 bg-red-950/10"
                )}
              >
                <span className={clsx("mt-1.5 h-2 w-2 flex-shrink-0 rounded-full", priorityBg(task.priority))} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx(
                      "font-semibold text-sm",
                      task.status === "missed" ? "text-red-300" :
                      task.status === "completed" ? "text-slate-500 line-through" : "text-slate-200"
                    )}>
                      {task.title}
                    </span>
                    {categoryBadge(task.category)}
                    {task.status === "missed" && <Badge variant="negative">Missed</Badge>}
                    {task.status === "completed" && <Badge variant="positive">Done</Badge>}
                  </div>
                  {task.description && (
                    <p className="mt-0.5 text-xs text-slate-500">{task.description}</p>
                  )}
                  <p className={clsx(
                    "mt-1 text-[11px]",
                    task.status === "missed" ? "text-red-400" :
                    overdue ? "text-red-400" :
                    urgent ? "text-amber-400" : "text-slate-500"
                  )}>
                    Due {formatShortDate(task.dueDate)}
                    {task.status === "open" && (
                      <span>
                        {" "}·{" "}
                        {days >= 0 ? `${days}d remaining` : `${Math.abs(days)}d overdue`}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={clsx(
                    "text-[11px] font-medium uppercase",
                    task.priority === "high" ? "text-red-400" :
                    task.priority === "medium" ? "text-amber-400" : "text-slate-500"
                  )}>
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
