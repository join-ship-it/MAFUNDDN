"use client";

import { useSimulation } from "@/store/simulationStore";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { formatShortDate, daysUntil } from "@/lib/dateUtils";
import { clsx } from "clsx";
import type { Deal } from "@/lib/types";

const STAGE_ORDER: Deal["stage"][] = [
  "sourced", "initial_review", "loi_sent", "due_diligence", "negotiation", "closing", "portfolio", "exited", "passed"
];

function stageMeta(stage: Deal["stage"]): { label: string; variant: "info" | "warning" | "positive" | "muted" | "negative" | "purple" } {
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
  return m[stage];
}

const KANBAN_STAGES: Deal["stage"][] = ["sourced", "initial_review", "loi_sent", "due_diligence", "negotiation"];

export default function PipelinePage() {
  const { state } = useSimulation();
  const { deals, currentDate } = state;

  const active = deals.filter((d) => !["passed", "exited"].includes(d.stage));
  const passed = deals.filter((d) => d.stage === "passed");
  const totalActiveEV = active.reduce((s, d) => s + d.impliedEV, 0);
  const lateStage = deals.filter((d) => ["due_diligence", "negotiation", "closing"].includes(d.stage));

  const sorted = [...deals].sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Deal Pipeline" />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Active Deals" value={active.length} sub={`${passed.length} passed`} />
          <StatTile label="Total Active EV" value={`$${totalActiveEV}M`} sub="Across all stages" accent />
          <StatTile label="Late Stage" value={lateStage.length} sub="DD / Neg / Closing" trend="up" />
          <StatTile label="Avg Ask Multiple" value={`${(active.reduce((s, d) => s + d.askMultiple, 0) / Math.max(active.length, 1)).toFixed(1)}x`} sub="EV/EBITDA" />
        </div>

        {/* Kanban */}
        <Card>
          <CardHeader><CardTitle>Pipeline Board</CardTitle></CardHeader>
          <div className="grid grid-cols-5 gap-3 overflow-x-auto min-w-[900px]">
            {KANBAN_STAGES.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage);
              const meta = stageMeta(stage);
              return (
                <div key={stage}>
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <span className="text-[11px] text-slate-500">{stageDeals.length}</span>
                  </div>
                  <div className="space-y-2">
                    {stageDeals.length === 0 && (
                      <div className="rounded border border-dashed border-[#1a2540] p-3 text-center text-[11px] text-slate-600">
                        Empty
                      </div>
                    )}
                    {stageDeals.map((deal) => (
                      <div key={deal.id} className="rounded border border-[#1a2540] bg-[#0a1020] p-2.5">
                        <p className="text-xs font-semibold text-slate-200">{deal.companyName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{deal.sector}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[11px] font-mono text-slate-300">${deal.impliedEV}M</span>
                          <span className="text-[10px] text-slate-500">{deal.askMultiple}x</span>
                        </div>
                        {deal.processDeadline && (
                          <p className={clsx("mt-1 text-[10px]", daysUntil(currentDate, deal.processDeadline) <= 14 ? "text-red-400" : "text-slate-500")}>
                            Due {formatShortDate(deal.processDeadline)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Deal Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Deals</CardTitle>
            <span className="text-xs text-slate-500">{deals.length} total</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a2540]">
                  {["Company", "Sector", "Revenue", "EBITDA", "EV", "Multiple", "Stage", "Source", "Deadline", "IRR", "MOIC"].map((h) => (
                    <th key={h} className="pb-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((deal) => {
                  const meta = stageMeta(deal.stage);
                  return (
                    <tr key={deal.id} className={clsx("border-b border-[#1a2540]/50 last:border-0 hover:bg-[#0a1020]/60", deal.stage === "passed" && "opacity-40")}>
                      <td className="py-2.5 pr-3 font-semibold text-slate-200">{deal.companyName}</td>
                      <td className="py-2.5 pr-3 text-slate-400">{deal.sector}</td>
                      <td className="py-2.5 pr-3 font-mono text-slate-300">${deal.revenue}M</td>
                      <td className="py-2.5 pr-3 font-mono text-slate-300">${deal.ebitda}M</td>
                      <td className="py-2.5 pr-3 font-mono font-bold text-slate-200">${deal.impliedEV}M</td>
                      <td className="py-2.5 pr-3 font-mono text-slate-300">{deal.askMultiple}x</td>
                      <td className="py-2.5 pr-3"><Badge variant={meta.variant}>{meta.label}</Badge></td>
                      <td className="py-2.5 pr-3 text-slate-400">{deal.sourcedFrom}</td>
                      <td className="py-2.5 pr-3">
                        {deal.processDeadline ? (
                          <span className={clsx("font-mono", daysUntil(currentDate, deal.processDeadline) <= 14 ? "text-red-400" : "text-slate-500")}>
                            {formatShortDate(deal.processDeadline)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-emerald-400">{deal.irr ? `${deal.irr}%` : "—"}</td>
                      <td className="py-2.5 text-emerald-400">{deal.moic ? `${deal.moic}x` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
