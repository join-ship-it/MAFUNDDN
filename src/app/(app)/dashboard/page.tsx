"use client";

import { useSimulation } from "@/store/simulationStore";
import { TopBar } from "@/components/layout/TopBar";
import { StatTile } from "@/components/ui/StatTile";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SimClock } from "@/components/dashboard/SimClock";
import { TimeLog } from "@/components/dashboard/TimeLog";
import { formatShortDate, daysUntil } from "@/lib/dateUtils";
import { clsx } from "clsx";
import type { Deal, Task, EventFeedItem } from "@/lib/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function dealStageBadge(stage: Deal["stage"]) {
  const m: Record<Deal["stage"], { label: string; variant: "info" | "warning" | "positive" | "muted" | "negative" | "purple" }> = {
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
  const entry = m[stage];
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

function eventIcon(type: EventFeedItem["type"]) {
  const m: Record<EventFeedItem["type"], string> = {
    deal_update: "📋",
    lp_update: "🤝",
    task_missed: "⚠",
    task_completed: "✓",
    reputation_change: "↘",
    time_advance: "⏩",
    deadline: "⏰",
    modeling: "📊",
  };
  return m[type] ?? "•";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { state, completeTask } = useSimulation();
  const { fund, lps, bankers, deals, tasks, eventFeed, reputationScore, modelingSkillScore, currentDate } = state;

  const activeDeals = deals.filter((d) => !["passed", "exited"].includes(d.stage));
  const openTasks = tasks.filter((t) => t.status === "open");
  const missedTasks = tasks.filter((t) => t.status === "missed");
  const lpProspects = lps.filter((l) => l.status === "prospect" || l.status === "soft_commit");
  const committedLPs = lps.filter((l) => l.status === "committed" || l.status === "closed");

  // Non-time-system events for the general activity feed
  const activityFeed = eventFeed
    .filter((e) => e.type !== "time_advance")
    .slice(0, 15);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Dashboard" />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* ── Simulation Time System (hero card) ─────────────────────────── */}
        <SimClock />

        {/* ── KPI strip ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          <StatTile
            label="Fund Target"
            value={`$${fund.targetSize}M`}
            sub={fund.strategy}
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
            sub={`${deals.filter(d => ["due_diligence", "negotiation"].includes(d.stage)).length} in late stage`}
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

        {/* ── Middle row: deals + tasks + LPs ───────────────────────────── */}
        <div className="grid grid-cols-12 gap-4">

          {/* Active Deals */}
          <Card className="col-span-12 xl:col-span-5">
            <CardHeader>
              <CardTitle>Active Deal Pipeline</CardTitle>
              <span className="text-xs text-slate-500">{activeDeals.length} deals</span>
            </CardHeader>
            <div className="space-y-1.5">
              {activeDeals.map((deal) => {
                const urgent = deal.processDeadline && daysUntil(currentDate, deal.processDeadline) <= 14;
                return (
                  <div
                    key={deal.id}
                    className={clsx(
                      "flex items-center gap-3 rounded border px-3 py-2",
                      urgent ? "border-amber-900/40 bg-amber-950/10" : "border-[#1a2540] bg-[#0a1020]"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-200">{deal.companyName}</span>
                        {dealStageBadge(deal.stage)}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{deal.sector}</span>
                        <span>·</span>
                        <span>${deal.revenue}M rev</span>
                        <span>·</span>
                        <span>{deal.askMultiple}x</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-slate-200">${deal.impliedEV}M</p>
                      {deal.processDeadline && (
                        <p className={clsx("text-[10px]", urgent ? "text-amber-400" : "text-slate-500")}>
                          {daysUntil(currentDate, deal.processDeadline)}d left
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Open / Missed Tasks */}
          <Card className="col-span-12 xl:col-span-4">
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <div className="flex items-center gap-2">
                {missedTasks.length > 0 && (
                  <Badge variant="negative">{missedTasks.length} missed</Badge>
                )}
                <span className="text-xs text-slate-500">{openTasks.length} open</span>
              </div>
            </CardHeader>
            <div className="space-y-1.5">
              {[...missedTasks, ...openTasks].slice(0, 8).map((task) => {
                const days = daysUntil(currentDate, task.dueDate);
                const urgent = task.status === "open" && days >= 0 && days <= 3;
                return (
                  <div
                    key={task.id}
                    className={clsx(
                      "flex items-start gap-2 rounded border px-2.5 py-2",
                      task.status === "missed"
                        ? "border-red-900/50 bg-red-950/20"
                        : urgent
                        ? "border-amber-900/40 bg-amber-950/10"
                        : "border-[#1a2540] bg-[#0a1020]"
                    )}
                  >
                    <span className={clsx(
                      "mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full",
                      task.priority === "high" ? "bg-red-400" :
                      task.priority === "medium" ? "bg-amber-400" : "bg-slate-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        "truncate text-xs font-medium",
                        task.status === "missed" ? "text-red-300" : "text-slate-200"
                      )}>
                        {task.title}
                      </p>
                      <p className={clsx(
                        "text-[10px] mt-0.5",
                        task.status === "missed" ? "text-red-500" :
                        urgent ? "text-amber-500" : "text-slate-500"
                      )}>
                        Due {formatShortDate(task.dueDate)}
                        {task.status === "open" && days >= 0 && ` · ${days}d`}
                        {task.status === "open" && days < 0 && ` · ${Math.abs(days)}d overdue`}
                      </p>
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
                );
              })}
            </div>
          </Card>

          {/* LP Status */}
          <Card className="col-span-12 xl:col-span-3">
            <CardHeader>
              <CardTitle>LP Register</CardTitle>
            </CardHeader>
            <div className="space-y-1.5">
              {lps.map((lp) => {
                const sv: Record<string, "positive" | "warning" | "info" | "muted"> = {
                  committed: "positive", soft_commit: "warning", prospect: "info", closed: "muted",
                };
                return (
                  <div key={lp.id} className="flex items-center gap-2 rounded border border-[#1a2540] bg-[#0a1020] px-2.5 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-200">{lp.name}</p>
                      <p className="text-[10px] text-slate-500">{lp.type.replace("_", " ")}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={sv[lp.status] ?? "muted"}>{lp.status.replace("_", " ")}</Badge>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {lp.committedAmount > 0 ? `$${lp.committedAmount}M` : `$${lp.targetCommitment}M target`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ── Bottom row: Time log + Bankers + Activity feed ─────────────── */}
        <div className="grid grid-cols-12 gap-4">

          {/* Time Advancement Log */}
          <div className="col-span-12 xl:col-span-5">
            <TimeLog />
          </div>

          {/* Banker Relationships */}
          <Card className="col-span-12 xl:col-span-3">
            <CardHeader>
              <CardTitle>Banker Relationships</CardTitle>
            </CardHeader>
            <div className="space-y-1.5">
              {bankers.map((b) => {
                const rv: Record<string, "positive" | "info" | "muted"> = {
                  active: "positive", warm: "info", cold: "muted", inactive: "muted",
                };
                return (
                  <div key={b.id} className="flex items-center gap-2 rounded border border-[#1a2540] bg-[#0a1020] px-2.5 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-200">{b.name}</p>
                      <p className="truncate text-[10px] text-slate-500">{b.firm}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={rv[b.relationship] ?? "muted"}>{b.relationship}</Badge>
                      <p className="text-[10px] text-slate-500 mt-0.5">{b.dealsShared} deals</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Activity Feed (non-time events) */}
          <Card className="col-span-12 xl:col-span-4">
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <span className="text-[10px] text-slate-600">Excluding time advances</span>
            </CardHeader>
            <div className="space-y-1">
              {activityFeed.map((evt) => (
                <div
                  key={evt.id}
                  className={clsx(
                    "flex items-start gap-2 rounded border px-2.5 py-2 text-xs",
                    evt.impact === "negative" ? "border-red-900/40 bg-red-950/10" :
                    evt.impact === "positive" ? "border-emerald-900/30 bg-emerald-950/10" :
                    "border-[#1a2540] bg-[#0a1020]"
                  )}
                >
                  <span className="flex-shrink-0 text-sm leading-none mt-0.5">{eventIcon(evt.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={clsx(
                      "font-medium truncate",
                      evt.impact === "negative" ? "text-red-300" :
                      evt.impact === "positive" ? "text-emerald-300" : "text-slate-300"
                    )}>
                      {evt.title}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{evt.description}</p>
                  </div>
                  <span className="flex-shrink-0 text-[10px] text-slate-600 font-mono">{formatShortDate(evt.date)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
