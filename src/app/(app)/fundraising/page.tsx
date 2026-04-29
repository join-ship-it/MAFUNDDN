"use client";

import { useState } from "react";
import { useSimulation, nextLPStatus } from "@/store/simulationStore";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

const NEXT_STATUS_LABEL: Partial<Record<LP["status"], string>> = {
  prospect: "Mark Soft Commit",
  soft_commit: "Mark Committed",
  committed: "Mark Closed",
};

export default function FundraisingPage() {
  const { state, advanceLPStatus, logLPContact } = useSimulation();
  const { fund, lps } = state;

  const [logNoteFor, setLogNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const committed = lps.filter((l) => l.status === "committed" || l.status === "closed");
  const softCommits = lps.filter((l) => l.status === "soft_commit");
  const prospects = lps.filter((l) => l.status === "prospect");

  const totalCommitted = lps.reduce((s, l) => s + l.committedAmount, 0);
  const totalSoftCommit = softCommits.reduce((s, l) => s + l.targetCommitment, 0);
  const gap = fund.targetSize - totalCommitted;

  const sorted = [...lps].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  function submitNote(lpId: string) {
    logLPContact(lpId, noteText.trim());
    setNoteText("");
    setLogNoteFor(null);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Fundraising" />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Target Size" value={`$${fund.targetSize}M`} />
          <StatTile
            label="Hard Committed"
            value={`$${totalCommitted}M`}
            sub={`${((totalCommitted / fund.targetSize) * 100).toFixed(0)}% of target`}
            accent trend="up"
          />
          <StatTile label="Soft Commits" value={`$${totalSoftCommit}M`} sub={`${softCommits.length} investors`} trend="up" />
          <StatTile
            label="Gap to Close"
            value={`$${gap.toFixed(0)}M`}
            sub={`${prospects.length} prospects in pipeline`}
            trend={gap > 50 ? "down" : "neutral"}
          />
        </div>

        {/* Capital stack bar */}
        <Card>
          <CardHeader><CardTitle>Capital Stack</CardTitle></CardHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                Committed ${totalCommitted}M
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/70" />
                Soft ${totalSoftCommit}M
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-700" />
                Gap ${gap.toFixed(0)}M
              </span>
            </div>
            <div className="h-4 rounded-full overflow-hidden bg-[#1a2540] flex">
              <div
                className="h-full bg-blue-500 transition-all duration-700"
                style={{ width: `${Math.min(100, (totalCommitted / fund.targetSize) * 100)}%` }}
              />
              <div
                className="h-full bg-amber-500/70 transition-all duration-700"
                style={{ width: `${Math.min(100 - (totalCommitted / fund.targetSize) * 100, (totalSoftCommit / fund.targetSize) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Fund target: ${fund.targetSize}M ·{" "}
              {((totalCommitted / fund.targetSize) * 100).toFixed(1)}% hard committed
            </p>
          </div>
        </Card>

        {/* LP table */}
        <Card>
          <CardHeader>
            <CardTitle>LP Investor Register</CardTitle>
            <span className="text-xs text-slate-500">{lps.length} investors</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a2540]">
                  {["Investor", "Type", "Tier", "Target", "Committed", "Status", "Contact", "Last Touch", "Actions"].map((h) => (
                    <th key={h} className="pb-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((lp) => {
                  const canAdvance = nextLPStatus(lp.status) !== null;
                  const nextLabel = NEXT_STATUS_LABEL[lp.status];
                  return (
                    <tr key={lp.id} className="border-b border-[#1a2540]/50 last:border-0">
                      <td className="py-2.5 pr-3 font-semibold text-slate-200">{lp.name}</td>
                      <td className="py-2.5 pr-3 text-slate-400">{lpTypeLabel(lp.type)}</td>
                      <td className="py-2.5 pr-3">
                        <span className={clsx("font-bold", lp.tier === 1 ? "text-blue-400" : lp.tier === 2 ? "text-amber-400" : "text-slate-500")}>
                          T{lp.tier}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-slate-300">${lp.targetCommitment}M</td>
                      <td className="py-2.5 pr-3 font-mono text-slate-300">
                        {lp.committedAmount > 0 ? `$${lp.committedAmount}M` : "—"}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge variant={statusVariant(lp.status)}>{lp.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-400">{lp.contactName}</td>
                      <td className="py-2.5 pr-3 text-slate-500">{formatShortDate(lp.lastContactDate)}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => setLogNoteFor(logNoteFor === lp.id ? null : lp.id)}>
                            Log
                          </Button>
                          {canAdvance && nextLabel && (
                            <Button size="sm" variant="success" onClick={() => advanceLPStatus(lp.id)}>
                              {nextLabel}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Inline log contact form */}
          {logNoteFor && (() => {
            const lp = lps.find((l) => l.id === logNoteFor);
            if (!lp) return null;
            return (
              <div className="mt-3 rounded border border-blue-800/50 bg-blue-950/20 p-3 space-y-2">
                <p className="text-xs font-semibold text-blue-300">Log contact — {lp.name}</p>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Call notes, next steps, key takeaways..."
                  className="w-full rounded border border-[#1a2540] bg-[#070c1a] px-2.5 py-2 text-xs text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-blue-700"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => submitNote(lp.id)}>
                    Save Contact
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setLogNoteFor(null); setNoteText(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            );
          })()}
        </Card>

        {/* Tier 1 LP detail cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lps.filter((l) => l.tier === 1).map((lp) => {
            const canAdvance = nextLPStatus(lp.status) !== null;
            const nextLabel = NEXT_STATUS_LABEL[lp.status];
            return (
              <Card key={lp.id} className="border-blue-900/40">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{lp.name}</p>
                    <p className="text-[11px] text-slate-500">{lp.contactTitle} — {lp.contactName}</p>
                  </div>
                  <Badge variant={statusVariant(lp.status)}>{lp.status.replace("_", " ")}</Badge>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400 mb-3">{lp.notes}</p>
                <p className="text-[10px] text-slate-600 mb-3">
                  Intro: {formatShortDate(lp.introductionDate)} · Last: {formatShortDate(lp.lastContactDate)}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => logLPContact(lp.id)}>
                    Log Contact
                  </Button>
                  {canAdvance && nextLabel && (
                    <Button size="sm" variant="success" onClick={() => advanceLPStatus(lp.id)}>
                      {nextLabel}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
