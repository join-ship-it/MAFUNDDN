"use client";

import { useSimulation } from "@/store/simulationStore";
import { TopBar } from "@/components/layout/TopBar";
import { StatTile } from "@/components/ui/StatTile";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatShortDate, daysUntil } from "@/lib/dateUtils";
import { clsx } from "clsx";
import type { Deal, Task, EventFeedItem } from "@/lib/types";

function dealStageBadge(stage: Deal["stage"]) {
  const map: Record<Deal["stage"], { label: string; variant: "info" | "warning" | "positive" | "muted" | "negative" | "purple" }> = {
    sourced: { label: "Sourced", variant: "muted" },
    initial_review: { label: "Initial Review", variant: "info" },
    loi_sent: { label: "LOI Sent", variant: "warning" },
    due_diligence: { label: "Due Diligence", variant: "purple" },
    negotiation: { label: "Negotiation", variant: "warning" },
    closing: { label: "Closing", variant: "positive" },
    portfolio: { label: "Portfolio", variant: "positive" },
    exited: { label: "Exited", variant: "muted" },
    passed: { label: "Passed", variant: "negative" },
  };
  const m = map[stage];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function taskPriorityDot(priority: Task["priority"]) {
  return (
    <span className={clsx("inline-block h-1.5 w-1.5 rounded-full flex-shrink-0", {
      "bg-red-400": priority === "high",
      "bg-amber-400": priority === "medium",
      "bg-slate-500": priority === "low",
    })} />
  );
}

function eventIcon(type: EventFeedItem["type"]) {
  const map: Record<EventFeedItem["type"], string> = {
    deal_update: "📋",
    lp_update: "🤝",
    task_missed: "⚠️",
    task_completed: "✓",
    reputation_change: "★",
    time_advance: "⏱",
    deadline: "⏰",
    modeling: "📊",
  };
  return map[type] ?? "•";
}

export default function DashboardPage() {
  const { state, advanceDays, advanceToNextDeadline, advanceToNextMajorEvent, completeTask } = useSimulation();
  const { fund, lps, bankers, deals, tasks, eventFeed, reputationScore, modelingSkillScore, currentDate } = state;

  const activeDeals = deals.filter((d) => !["passed", "exited"].includes(d.stage));
  const openTasks = tasks.filter((t) => t.status === "open");
  const missedTasks = tasks.filter((t) => t.status === "missed");
  const lpProspects = lps.filter((l) => l.status === "prospect" || l.status === "soft_commit");
  const committedLPs = lps.filter((l) => l.status === "committed" || l.status === "closed");

  const upcomingDeadlines = [
    ...tasks
      .filter((t) => t.status === "open" && t.dueDate > currentDate)
      .map((t) => ({ label: t.title, date: t.dueDate, type: "task" as const, priority: t.priority })),
    ...deals
      .filter((d) => d.processDeadline && d.processDeadline > currentDate)
      .map((d) => ({ label: `${d.companyName} — process deadline`, date: d.processDeadline!, type: "deal" as const, priority: "high" as const })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  const recentFeed = eventFeed.slice(0, 12);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Dashboard" />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          <StatTile
            label="Fund Target"
            value={`$${fund.targetSize}M`}
            sub={fund.strategy}
            className="col-span-1"
          />
          <StatTile
            label="Committed"
            value={`$${fund.committedCapital}M`}
            sub={`${Math.round((fund.committedCapital / fund.targetSize) * 100)}% of target`}
            trend="up"
            accent
          />
          <StatTile
            label="Called Capital"
            value={`$${fund.calledCapital}M`}
            sub={`${Math.round((fund.calledCapital / fund.committedCapital) * 100)}% deployed`}
          />
          <StatTile
            label="Active Deals"
            value={activeDeals.length}
            sub={`${deals.filter(d => d.stage === "due_diligence" || d.stage === "negotiation").length} in late stage`}
          />
          <StatTile
            label="Open Tasks"
            value={openTasks.length}
            sub={missedTasks.length > 0 ? `${missedTasks.length} missed` : "All on track"}
            trend={missedTasks.length > 0 ? "down" : "neutral"}
          />
          <StatTile
            label="LP Prospects"
            value={lpProspects.length}
            sub={`${committedLPs.length} committed`}
            trend="up"
          />
          <StatTile
            label="Reputation"
            value={reputationScore}
            sub={reputationScore >= 70 ? "Strong" : reputationScore >= 40 ? "Developing" : "At Risk"}
            trend={reputationScore >= 60 ? "up" : "down"}
          />
          <StatTile
            label="Modeling Skill"
            value={modelingSkillScore}
            sub="Complete tasks to improve"
            trend="up"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Active Deals */}
          <Card className="col-span-12 xl:col-span-5">
            <CardHeader>
              <CardTitle>Active Deal Pipeline</CardTitle>
              <span className="text-xs text-slate-500">{activeDeals.length} deals</span>
            </CardHeader>
            <div className="space-y-2">
              {activeDeals.map((deal) => (
                <div key={deal.id} className="flex items-center gap-3 rounded border border-[#1a2540] bg-[#0a1020] px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-200">{deal.companyName}</span>
                      {dealStageBadge(deal.stage)}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{deal.sector}</span>
                      <span>•</span>
                      <span>${deal.revenue}M rev</span>
                      <span>•</span>
                      <span>{deal.askMultiple}x EV/EBITDA</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-200">${deal.impliedEV}M</p>
                    {deal.processDeadline && (
                      <p className={clsx("text-[10px]", daysUntil(currentDate, deal.processDeadline) <= 14 ? "text-red-400" : "text-slate-500")}>
                        {daysUntil(currentDate, deal.processDeadline)}d left
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="col-span-12 xl:col-span-3">
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <div className="space-y-1.5">
              {upcomingDeadlines.map((item, i) => {
                const days = daysUntil(currentDate, item.date);
                const urgent = days <= 7;
                return (
                  <div key={i} className="flex items-start gap-2 rounded border border-[#1a2540] bg-[#0a1020] px-2.5 py-2">
                    <span className={clsx("mt-0.5 h-2 w-2 flex-shrink-0 rounded-full", urgent ? "bg-red-400" : item.priority === "high" ? "bg-amber-400" : "bg-slate-600")} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium text-slate-200">{item.label}</p>
                      <p className={clsx("text-[11px]", urgent ? "text-red-400" : "text-slate-500")}>
                        {formatShortDate(item.date)} · {days}d
                      </p>
                    </div>
                  </div>
                );
              })}
              {upcomingDeadlines.length === 0 && (
                <p className="text-xs text-slate-500 py-2">No upcoming deadlines.</p>
              )}
            </div>
          </Card>

          {/* Open Tasks */}
          <Card className="col-span-12 xl:col-span-4">
            <CardHeader>
              <CardTitle>Open Tasks</CardTitle>
              <span className="text-xs text-slate-500">{openTasks.length} open · {missedTasks.length} missed</span>
            </CardHeader>
            <div className="space-y-1.5">
              {[...missedTasks, ...openTasks].slice(0, 7).map((task) => (
                <div
                  key={task.id}
                  className={clsx(
                    "flex items-start gap-2 rounded border px-2.5 py-2",
                    task.status === "missed"
                      ? "border-red-900/50 bg-red-950/20"
                      : "border-[#1a2540] bg-[#0a1020]"
                  )}
                >
                  {taskPriorityDot(task.priority)}
                  <div className="flex-1 min-w-0">
                    <p className={clsx("truncate text-xs font-medium", task.status === "missed" ? "text-red-300" : "text-slate-200")}>
                      {task.title}
                    </p>
                    <p className="text-[11px] text-slate-500">Due {formatShortDate(task.dueDate)}</p>
                  </div>
                  {task.status === "open" && (
                    <button
                      onClick={() => completeTask(task.id)}
                      className="flex-shrink-0 rounded border border-[#1e2d4a] px-1.5 py-0.5 text-[10px] text-slate-500 hover:border-emerald-700 hover:text-emerald-400 transition-colors"
                    >
                      Done
                    </button>
                  )}
                  {task.status === "missed" && (
                    <Badge variant="negative">Missed</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Lower row */}
        <div className="grid grid-cols-12 gap-4">
          {/* LP Status */}
          <Card className="col-span-12 xl:col-span-4">
            <CardHeader>
              <CardTitle>LP Prospects & Commitments</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {lps.map((lp) => {
                const statusVariant: Record<string, "positive" | "warning" | "info" | "muted"> = {
                  committed: "positive",
                  soft_commit: "warning",
                  prospect: "info",
                  closed: "muted",
                };
                return (
                  <div key={lp.id} className="flex items-center gap-3 rounded border border-[#1a2540] bg-[#0a1020] px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-200">{lp.name}</p>
                      <p className="text-[11px] text-slate-500">{lp.contactName} · {lp.location}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={statusVariant[lp.status] ?? "muted"}>
                        {lp.status.replace("_", " ")}
                      </Badge>
                      <p className="mt-0.5 text-[11px] font-bold text-slate-300">
                        {lp.committedAmount > 0 ? `$${lp.committedAmount}M` : `Target $${lp.targetCommitment}M`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Banker relationships */}
          <Card className="col-span-12 xl:col-span-3">
            <CardHeader>
              <CardTitle>Banker Relationships</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {bankers.map((b) => {
                const relVariant: Record<string, "positive" | "warning" | "info" | "muted"> = {
                  active: "positive",
                  warm: "info",
                  cold: "muted",
                  inactive: "muted",
                };
                return (
                  <div key={b.id} className="flex items-center gap-2 rounded border border-[#1a2540] bg-[#0a1020] px-2.5 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-200">{b.name}</p>
                      <p className="truncate text-[11px] text-slate-500">{b.firm} · {b.coverage}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={relVariant[b.relationship] ?? "muted"}>{b.relationship}</Badge>
                      <p className="mt-0.5 text-[10px] text-slate-500">{b.dealsShared} deals</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Event Feed */}
          <Card className="col-span-12 xl:col-span-5">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <span className="text-[10px] text-slate-600">Last {recentFeed.length} events</span>
            </CardHeader>
            <div className="space-y-1">
              {recentFeed.map((evt) => (
                <div
                  key={evt.id}
                  className={clsx(
                    "flex items-start gap-2 rounded border px-2.5 py-2 text-xs",
                    evt.impact === "negative"
                      ? "border-red-900/40 bg-red-950/10"
                      : evt.impact === "positive"
                      ? "border-emerald-900/30 bg-emerald-950/10"
                      : "border-[#1a2540] bg-[#0a1020]"
                  )}
                >
                  <span className="flex-shrink-0 text-sm leading-none mt-0.5">{eventIcon(evt.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={clsx("font-medium truncate", evt.impact === "negative" ? "text-red-300" : evt.impact === "positive" ? "text-emerald-300" : "text-slate-300")}>
                      {evt.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{evt.description}</p>
                  </div>
                  <span className="flex-shrink-0 text-[10px] text-slate-600 font-mono">{formatShortDate(evt.date)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Time Controls reminder */}
        <Card className="border-blue-900/40 bg-blue-950/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-300">Simulation Time Controls</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Time only advances when you use the controls above. Deadlines are never missed due to real-world time passing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => advanceDays(1)}>+1 Day</Button>
              <Button size="sm" variant="secondary" onClick={() => advanceDays(7)}>+1 Week</Button>
              <Button size="sm" variant="ghost" onClick={advanceToNextDeadline}>→ Deadline</Button>
              <Button size="sm" variant="primary" onClick={advanceToNextMajorEvent}>→ Major Event</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
