"use client";

import { useSimulation } from "@/store/simulationStore";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { formatShortDate } from "@/lib/dateUtils";
import { clsx } from "clsx";
import type { LP } from "@/lib/types";

const STATUS_ORDER: LP["status"][] = ["committed", "soft_commit", "prospect", "closed"];

function statusVariant(s: LP["status"]): "positive" | "warning" | "info" | "muted" {
  if (s === "committed") return "positive";
  if (s === "soft_commit") return "warning";
  if (s === "prospect") return "info";
  return "muted";
}

function lpTypeLabel(t: LP["type"]) {
  const m: Record<LP["type"], string> = {
    family_office: "Family Office",
    endowment: "Endowment",
    pension: "Pension",
    hnw: "HNW",
    fund_of_funds: "FOF",
    insurance: "Insurance",
  };
  return m[t] ?? t;
}

export default function FundraisingPage() {
  const { state } = useSimulation();
  const { fund, lps, currentDate } = state;

  const committed = lps.filter((l) => l.status === "committed" || l.status === "closed");
  const softCommits = lps.filter((l) => l.status === "soft_commit");
  const prospects = lps.filter((l) => l.status === "prospect");

  const totalCommitted = lps.reduce((s, l) => s + l.committedAmount, 0);
  const totalSoftCommit = softCommits.reduce((s, l) => s + l.targetCommitment, 0);
  const gap = fund.targetSize - totalCommitted;

  const sorted = [...lps].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Fundraising" />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Target Size" value={`$${fund.targetSize}M`} />
          <StatTile label="Hard Committed" value={`$${totalCommitted}M`} sub={`${((totalCommitted / fund.targetSize) * 100).toFixed(0)}% of target`} accent trend="up" />
          <StatTile label="Soft Commits" value={`$${totalSoftCommit}M`} sub={`${softCommits.length} LPs`} trend="up" />
          <StatTile label="Gap to Close" value={`$${gap.toFixed(0)}M`} sub={`${prospects.length} prospects in pipeline`} trend={gap > 50 ? "down" : "neutral"} />
        </div>

        {/* Fundraising progress bar */}
        <Card>
          <CardHeader><CardTitle>Capital Stack</CardTitle></CardHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Committed ${totalCommitted}M</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Soft ${totalSoftCommit}M</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-700" /> Gap ${gap.toFixed(0)}M</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden bg-[#1a2540] flex">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, (totalCommitted / fund.targetSize) * 100)}%` }}
              />
              <div
                className="h-full bg-amber-500/70 transition-all"
                style={{ width: `${Math.min(100 - (totalCommitted / fund.targetSize) * 100, (totalSoftCommit / fund.targetSize) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Fund target: ${fund.targetSize}M · {((totalCommitted / fund.targetSize) * 100).toFixed(1)}% hard committed
            </p>
          </div>
        </Card>

        {/* LP Table */}
        <Card>
          <CardHeader>
            <CardTitle>LP Investor Register</CardTitle>
            <span className="text-xs text-slate-500">{lps.length} investors</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a2540]">
                  {["Investor", "Type", "Tier", "Target", "Committed", "Status", "Contact", "Last Touch"].map((h) => (
                    <th key={h} className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((lp) => (
                  <tr key={lp.id} className="border-b border-[#1a2540]/50 last:border-0 hover:bg-[#0a1020]/50">
                    <td className="py-2.5 pr-4">
                      <p className="font-semibold text-slate-200">{lp.name}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400">{lpTypeLabel(lp.type)}</td>
                    <td className="py-2.5 pr-4">
                      <span className={clsx("font-bold", lp.tier === 1 ? "text-blue-400" : lp.tier === 2 ? "text-amber-400" : "text-slate-500")}>
                        T{lp.tier}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-slate-300">${lp.targetCommitment}M</td>
                    <td className="py-2.5 pr-4 font-mono text-slate-300">
                      {lp.committedAmount > 0 ? `$${lp.committedAmount}M` : "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge variant={statusVariant(lp.status)}>{lp.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400">{lp.contactName}</td>
                    <td className="py-2.5 text-slate-500">{formatShortDate(lp.lastContactDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Notes on top prospects */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lps.filter((l) => l.tier === 1).map((lp) => (
            <Card key={lp.id} className="border-blue-900/40">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{lp.name}</p>
                  <p className="text-[11px] text-slate-500">{lp.contactTitle} — {lp.contactName}</p>
                </div>
                <Badge variant={statusVariant(lp.status)}>{lp.status.replace("_", " ")}</Badge>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">{lp.notes}</p>
              <p className="mt-2 text-[10px] text-slate-600">
                Intro: {formatShortDate(lp.introductionDate)} · Last: {formatShortDate(lp.lastContactDate)}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
