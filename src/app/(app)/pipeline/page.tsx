"use client";

import { useState } from "react";
import { useSimulation } from "@/store/simulationStore";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { DealPanel } from "@/components/deals/DealPanel";
import { formatShortDate, daysUntil } from "@/lib/dateUtils";
import { clsx } from "clsx";
import type { Deal } from "@/lib/types";

const STAGE_ORDER: Deal["stage"][] = [
  "sourced", "initial_review", "loi_sent", "due_diligence",
  "negotiation", "closing", "portfolio", "exited", "passed",
];

function stageMeta(stage: Deal["stage"]): {
  label: string;
  variant: "info" | "warning" | "positive" | "muted" | "negative" | "purple";
} {
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
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const active = deals.filter((d) => !["passed", "exited"].includes(d.stage));
  const passed = deals.filter((d) => d.stage === "passed" || d.stage === "exited");
  const totalActiveEV = active.reduce((s, d) => s + d.impliedEV, 0);
  const lateStage = deals.filter((d) => ["due_diligence", "negotiation", "closing"].includes(d.stage));
  const sorted = [...deals].sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <TopBar title="Deal Pipeline" />
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="Active Deals" value={active.length} sub={`${passed.length} passed/exited`} />
            <StatTile label="Total Active EV" value={`$${totalActiveEV}M`} sub="Across all active stages" accent />
            <StatTile label="Late Stage" value={lateStage.length} sub="DD / Negotiation / Closing" trend="up" />
            <StatTile
              label="Avg Ask Multiple"
              value={`${active.length ? (active.reduce((s, d) => s + d.askMultiple, 0) / active.length).toFixed(1) : "—"}x`}
              sub="EV/EBITDA on active deals"
            />
          </div>

          {/* Kanban */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Board</CardTitle>
              <span className="text-[11px] text-slate-500">Click any card to view details & advance stage</span>
            </CardHeader>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 gap-3 min-w-[860px]">
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
                          <div className="rounded border border-dashed border-[#1a2540] p-3 text-center text-[11px] text-slate-700">
                            Empty
                          </div>
                        )}
                        {stageDeals.map((deal) => {
                          const urgentDeadline =
                            deal.processDeadline &&
                            daysUntil(currentDate, deal.processDeadline) <= 14;
                          return (
                            <button
                              key={deal.id}
                              onClick={() => setSelectedDeal(deal)}
                              className={clsx(
                                "w-full text-left rounded border px-2.5 py-2.5 transition-all hover:border-blue-700/60 hover:bg-[#0d1830]",
                                urgentDeadline ? "border-amber-800/60 bg-amber-950/10" : "border-[#1a2540] bg-[#0a1020]"
                              )}
                            >
                              <p className="text-xs font-semibold text-slate-200">{deal.companyName}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{deal.sector}</p>
                              <div className="mt-1.5 flex items-center justify-between">
                                <span className="text-[11px] font-mono text-slate-300">${deal.impliedEV}M</span>
                                <span className="text-[10px] text-slate-500">{deal.askMultiple}x</span>
                              </div>
                              {deal.processDeadline && (
                                <p className={clsx("mt-1 text-[10px]", urgentDeadline ? "text-amber-400" : "text-slate-600")}>
                                  {formatShortDate(deal.processDeadline)}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Deal Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Deals</CardTitle>
              <span className="text-xs text-slate-500">{deals.length} total · click row to open</span>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1a2540]">
                    {["Company", "Sector", "Revenue", "EBITDA", "EV", "Multiple", "Stage", "Source", "Deadline", "IRR", "MOIC"].map((h) => (
                      <th key={h} className="pb-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((deal) => {
                    const meta = stageMeta(deal.stage);
                    const urgent = deal.processDeadline && daysUntil(currentDate, deal.processDeadline) <= 7;
                    return (
                      <tr
                        key={deal.id}
                        onClick={() => setSelectedDeal(deal)}
                        className={clsx(
                          "border-b border-[#1a2540]/50 last:border-0 cursor-pointer transition-colors hover:bg-[#0d1830]",
                          deal.stage === "passed" && "opacity-40"
                        )}
                      >
                        <td className="py-2.5 pr-3 font-semibold text-slate-200">{deal.companyName}</td>
                        <td className="py-2.5 pr-3 text-slate-400">{deal.sector}</td>
                        <td className="py-2.5 pr-3 font-mono text-slate-300">${deal.revenue}M</td>
                        <td className="py-2.5 pr-3 font-mono text-slate-300">${deal.ebitda}M</td>
                        <td className="py-2.5 pr-3 font-mono font-bold text-slate-200">${deal.impliedEV}M</td>
                        <td className="py-2.5 pr-3 font-mono text-slate-300">{deal.askMultiple}x</td>
                        <td className="py-2.5 pr-3">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </td>
                        <td className="py-2.5 pr-3 text-slate-400">{deal.sourcedFrom}</td>
                        <td className="py-2.5 pr-3">
                          {deal.processDeadline ? (
                            <span className={clsx("font-mono", urgent ? "text-red-400" : "text-slate-500")}>
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

      <DealPanel deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </>
  );
}
