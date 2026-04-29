"use client";

import { useState } from "react";
import { useSimulation } from "@/store/simulationStore";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { formatShortDate } from "@/lib/dateUtils";
import { clsx } from "clsx";

type Tab = "bankers" | "lps";

export default function CRMPage() {
  const { state } = useSimulation();
  const { bankers, lps } = state;
  const [tab, setTab] = useState<Tab>("bankers");

  const activeBankers = bankers.filter((b) => b.relationship === "active" || b.relationship === "warm");
  const totalDeals = bankers.reduce((s, b) => s + b.dealsShared, 0);
  const committed = lps.filter((l) => l.status === "committed" || l.status === "closed");

  const relVariant = (r: string): "positive" | "info" | "muted" => {
    if (r === "active") return "positive";
    if (r === "warm") return "info";
    return "muted";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="CRM" />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Banker Contacts" value={bankers.length} sub={`${activeBankers.length} active/warm`} />
          <StatTile label="Deals Sourced" value={totalDeals} sub="From banker network" accent />
          <StatTile label="LP Contacts" value={lps.length} sub={`${committed.length} committed`} />
          <StatTile label="Avg Relationship" value={`${Math.round((bankers.filter(b => b.relationship === "active").length / bankers.length) * 100)}%`} sub="Active relationships" trend="up" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1e2d4a]">
          {(["bankers", "lps"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors",
                tab === t
                  ? "border-blue-500 text-blue-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              {t === "bankers" ? "Investment Bankers" : "Limited Partners"}
            </button>
          ))}
        </div>

        {tab === "bankers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {bankers.map((b) => (
              <Card key={b.id} className={clsx(b.relationship === "active" && "border-emerald-900/40")}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{b.name}</p>
                    <p className="text-[11px] text-slate-500">{b.title}</p>
                  </div>
                  <Badge variant={relVariant(b.relationship)}>{b.relationship}</Badge>
                </div>
                <p className="text-xs text-blue-400 font-medium mb-2">{b.firm}</p>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coverage</span>
                    <span>{b.coverage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deals Shared</span>
                    <span className="font-semibold text-slate-200">{b.dealsShared}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Interaction</span>
                    <span>{formatShortDate(b.lastInteraction)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#1a2540] space-y-0.5">
                  <p className="text-[10px] text-slate-500">{b.email}</p>
                  <p className="text-[10px] text-slate-500">{b.phone}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "lps" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {lps.map((lp) => {
              const statusVariant: Record<string, "positive" | "warning" | "info" | "muted"> = {
                committed: "positive",
                soft_commit: "warning",
                prospect: "info",
                closed: "muted",
              };
              return (
                <Card key={lp.id} className={clsx(lp.status === "committed" && "border-emerald-900/40")}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{lp.name}</p>
                      <p className="text-[11px] text-slate-500">{lp.contactTitle}</p>
                    </div>
                    <Badge variant={statusVariant[lp.status] ?? "muted"}>{lp.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-blue-400 font-medium mb-2">{lp.contactName} · {lp.location}</p>
                  <div className="space-y-1 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Type</span>
                      <span>{lp.type.replace("_", " ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Commit</span>
                      <span className="font-semibold text-slate-200">${lp.targetCommitment}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Committed</span>
                      <span className="font-semibold text-slate-200">{lp.committedAmount > 0 ? `$${lp.committedAmount}M` : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Contact</span>
                      <span>{formatShortDate(lp.lastContactDate)}</span>
                    </div>
                  </div>
                  <p className="mt-2 pt-2 border-t border-[#1a2540] text-[11px] leading-relaxed text-slate-500">
                    {lp.notes}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
