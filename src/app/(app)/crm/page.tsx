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

type Tab = "bankers" | "lps";

const NEXT_STATUS_LABEL: Partial<Record<string, string>> = {
  prospect: "Soft Commit",
  soft_commit: "Committed",
  committed: "Closed",
};

export default function CRMPage() {
  const { state, advanceLPStatus, logLPContact, logBankerContact } = useSimulation();
  const { bankers, lps } = state;
  const [tab, setTab] = useState<Tab>("bankers");
  const [logNoteFor, setLogNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const activeBankers = bankers.filter((b) => b.relationship === "active" || b.relationship === "warm");
  const totalDeals = bankers.reduce((s, b) => s + b.dealsShared, 0);
  const committed = lps.filter((l) => l.status === "committed" || l.status === "closed");

  const relVariant = (r: string): "positive" | "info" | "muted" => {
    if (r === "active") return "positive";
    if (r === "warm") return "info";
    return "muted";
  };

  const statusVariant = (s: string): "positive" | "warning" | "info" | "muted" => {
    if (s === "committed") return "positive";
    if (s === "soft_commit") return "warning";
    if (s === "prospect") return "info";
    return "muted";
  };

  function submitLPNote(lpId: string) {
    logLPContact(lpId, noteText.trim());
    setNoteText("");
    setLogNoteFor(null);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="CRM" />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Banker Contacts" value={bankers.length} sub={`${activeBankers.length} active/warm`} />
          <StatTile label="Deals Sourced" value={totalDeals} sub="Via banker network" accent />
          <StatTile label="LP Contacts" value={lps.length} sub={`${committed.length} committed`} />
          <StatTile
            label="Active Bankers"
            value={`${Math.round((bankers.filter(b => b.relationship === "active").length / bankers.length) * 100)}%`}
            sub="Active relationships"
            trend="up"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1e2d4a]">
          {(["bankers", "lps"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors",
                tab === t ? "border-blue-500 text-blue-300" : "border-transparent text-slate-400 hover:text-slate-200"
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
                <p className="text-xs font-medium text-blue-400 mb-2">{b.firm}</p>
                <div className="space-y-1 text-xs text-slate-400 mb-3">
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
                    <span className={clsx(
                      // flag if it's been more than 30 days since last interaction
                      new Date(state.currentDate).getTime() - new Date(b.lastInteraction).getTime() > 30 * 86400000
                        ? "text-amber-400"
                        : "text-slate-400"
                    )}>
                      {formatShortDate(b.lastInteraction)}
                    </span>
                  </div>
                </div>
                <div className="mb-3 pt-2 border-t border-[#1a2540] space-y-0.5">
                  <p className="text-[10px] text-slate-500">{b.email}</p>
                  <p className="text-[10px] text-slate-500">{b.phone}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => logBankerContact(b.id)} className="w-full">
                  Log Outreach
                </Button>
              </Card>
            ))}
          </div>
        )}

        {tab === "lps" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {lps.map((lp) => {
              const canAdvance = nextLPStatus(lp.status) !== null;
              const nextLabel = NEXT_STATUS_LABEL[lp.status];
              const isLogging = logNoteFor === lp.id;

              return (
                <Card key={lp.id} className={clsx(lp.status === "committed" && "border-emerald-900/40")}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{lp.name}</p>
                      <p className="text-[11px] text-slate-500">{lp.contactTitle}</p>
                    </div>
                    <Badge variant={statusVariant(lp.status)}>{lp.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs font-medium text-blue-400 mb-2">{lp.contactName} · {lp.location}</p>
                  <div className="space-y-1 text-xs text-slate-400 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Type</span>
                      <span>{lp.type.replace("_", " ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target</span>
                      <span className="font-semibold text-slate-200">${lp.targetCommitment}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Committed</span>
                      <span className="font-semibold text-slate-200">
                        {lp.committedAmount > 0 ? `$${lp.committedAmount}M` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Contact</span>
                      <span>{formatShortDate(lp.lastContactDate)}</span>
                    </div>
                  </div>
                  <p className="mb-3 pt-2 border-t border-[#1a2540] text-[11px] leading-relaxed text-slate-500 line-clamp-3">
                    {lp.notes}
                  </p>

                  {isLogging ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Call notes, next steps..."
                        autoFocus
                        className="w-full rounded border border-[#1a2540] bg-[#070c1a] px-2.5 py-2 text-xs text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-blue-700"
                        rows={2}
                      />
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="primary" onClick={() => submitLPNote(lp.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setLogNoteFor(null); setNoteText(""); }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setLogNoteFor(lp.id)} className="flex-1">
                        Log Contact
                      </Button>
                      {canAdvance && nextLabel && (
                        <Button size="sm" variant="success" onClick={() => advanceLPStatus(lp.id)}>
                          → {nextLabel}
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
