"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { useSimulation, STAGE_LABELS, nextStage } from "@/store/simulationStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatShortDate, daysUntil } from "@/lib/dateUtils";
import type { Deal, DealStage } from "@/lib/types";

const STAGE_SEQUENCE: DealStage[] = [
  "sourced", "initial_review", "loi_sent", "due_diligence",
  "negotiation", "closing", "portfolio", "exited",
];

function stageMeta(stage: DealStage) {
  const m: Record<DealStage, { variant: "info" | "warning" | "positive" | "muted" | "negative" | "purple" }> = {
    sourced: { variant: "muted" },
    initial_review: { variant: "info" },
    loi_sent: { variant: "warning" },
    due_diligence: { variant: "purple" },
    negotiation: { variant: "warning" },
    closing: { variant: "positive" },
    portfolio: { variant: "positive" },
    exited: { variant: "muted" },
    passed: { variant: "negative" },
  };
  return m[stage];
}

function ManagementStars({ quality }: { quality: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= quality ? "text-amber-400" : "text-slate-700"}>★</span>
      ))}
    </span>
  );
}

interface DealPanelProps {
  deal: Deal | null;
  onClose: () => void;
}

export function DealPanel({ deal, onClose }: DealPanelProps) {
  const { state, advanceDealStage, passDeal } = useSimulation();
  const [passReason, setPassReason] = useState("");
  const [showPassForm, setShowPassForm] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (deal) {
      // slight delay so CSS transition fires
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [deal]);

  if (!deal) return null;

  // Get fresh deal data from store (stage may have changed)
  const liveDeal = state.deals.find((d) => d.id === deal.id) ?? deal;
  const canAdvance = nextStage(liveDeal.stage) !== null && liveDeal.stage !== "passed" && liveDeal.stage !== "exited";
  const isPassed = liveDeal.stage === "passed" || liveDeal.stage === "exited";

  const currentStageIdx = STAGE_SEQUENCE.indexOf(liveDeal.stage);
  const daysLeft = liveDeal.processDeadline ? daysUntil(state.currentDate, liveDeal.processDeadline) : null;

  const linkedTasks = state.tasks.filter((t) => t.linkedDealId === liveDeal.id && t.status === "open");

  function handleAdvance() {
    advanceDealStage(liveDeal.id);
    setShowPassForm(false);
  }

  function handlePass() {
    if (!passReason.trim()) return;
    passDeal(liveDeal.id, passReason.trim());
    setPassReason("");
    setShowPassForm(false);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 z-30 bg-black/50 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={clsx(
          "fixed right-0 top-0 z-40 h-full w-[480px] flex flex-col border-l border-[#1e2d4a] bg-[#080d1c] shadow-2xl transition-transform duration-300",
          visible ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1e2d4a] px-5 py-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 truncate">{liveDeal.companyName}</h2>
              <Badge variant={stageMeta(liveDeal.stage).variant}>{STAGE_LABELS[liveDeal.stage]}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{liveDeal.sector} · Sourced {formatShortDate(liveDeal.entryDate)}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 text-slate-500 hover:text-slate-300 text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Stage timeline */}
          {!isPassed && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Stage Progress</p>
              <div className="flex items-center gap-1">
                {STAGE_SEQUENCE.filter(s => s !== "exited").map((s, i) => {
                  const done = i < currentStageIdx;
                  const active = i === currentStageIdx;
                  return (
                    <div key={s} className="flex items-center flex-1">
                      <div className={clsx(
                        "h-1.5 flex-1 rounded-full",
                        done ? "bg-blue-500" : active ? "bg-blue-700" : "bg-[#1a2540]"
                      )} />
                      {i === STAGE_SEQUENCE.filter(s => s !== "exited").length - 1 && (
                        <div className={clsx("ml-1 h-2.5 w-2.5 rounded-full flex-shrink-0", done ? "bg-blue-500" : active ? "bg-blue-400" : "bg-[#1a2540]")} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-600">
                <span>Sourced</span>
                <span>Portfolio</span>
              </div>
            </div>
          )}

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "EV", value: `$${liveDeal.impliedEV}M` },
              { label: "Revenue", value: `$${liveDeal.revenue}M` },
              { label: "EBITDA", value: `$${liveDeal.ebitda}M` },
              { label: "Multiple", value: `${liveDeal.askMultiple}x` },
              { label: "Proj. IRR", value: liveDeal.irr ? `${liveDeal.irr}%` : "—" },
              { label: "Proj. MOIC", value: liveDeal.moic ? `${liveDeal.moic}x` : "—" },
            ].map((m) => (
              <div key={m.label} className="rounded border border-[#1a2540] bg-[#0a1020] px-2.5 py-2 text-center">
                <p className="text-[10px] uppercase text-slate-500">{m.label}</p>
                <p className="mt-0.5 text-sm font-bold text-slate-200">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Process deadline */}
          {liveDeal.processDeadline && !isPassed && (
            <div className={clsx(
              "flex items-center gap-2 rounded border px-3 py-2",
              daysLeft !== null && daysLeft <= 7 ? "border-red-800 bg-red-950/20" : "border-amber-800/50 bg-amber-950/10"
            )}>
              <span className="text-sm">⏰</span>
              <div>
                <p className={clsx("text-xs font-semibold", daysLeft !== null && daysLeft <= 7 ? "text-red-300" : "text-amber-300")}>
                  Process Deadline: {formatShortDate(liveDeal.processDeadline)}
                </p>
                {daysLeft !== null && (
                  <p className="text-[11px] text-slate-500">
                    {daysLeft >= 0 ? `${daysLeft} days remaining` : `${Math.abs(daysLeft)} days overdue`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Source + Management */}
          <div className="rounded border border-[#1a2540] bg-[#0a1020] px-3 py-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Source</span>
              <span className="text-slate-300">{liveDeal.sourcedFrom} <span className="text-slate-600">({liveDeal.sourceType})</span></span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Management</span>
              <ManagementStars quality={liveDeal.managementQuality} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Notes</p>
            <p className="text-xs leading-relaxed text-slate-400 whitespace-pre-line">{liveDeal.notes}</p>
          </div>

          {/* Linked open tasks */}
          {linkedTasks.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Open Tasks ({linkedTasks.length})</p>
              <div className="space-y-1.5">
                {linkedTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 rounded border border-[#1a2540] bg-[#0a1020] px-2.5 py-1.5">
                    <span className={clsx("h-1.5 w-1.5 flex-shrink-0 rounded-full", t.priority === "high" ? "bg-red-400" : t.priority === "medium" ? "bg-amber-400" : "bg-slate-500")} />
                    <span className="flex-1 text-xs text-slate-300">{t.title}</span>
                    <span className="text-[10px] text-slate-500">{formatShortDate(t.dueDate)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pass reason form */}
          {showPassForm && (
            <div className="rounded border border-red-800/60 bg-red-950/20 p-3 space-y-2">
              <p className="text-xs font-semibold text-red-300">Pass on {liveDeal.companyName}</p>
              <textarea
                value={passReason}
                onChange={(e) => setPassReason(e.target.value)}
                placeholder="Reason for passing (valuation, fit, risk, etc.)"
                className="w-full rounded border border-[#1a2540] bg-[#070c1a] px-2.5 py-2 text-xs text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-red-700"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="danger" onClick={handlePass} disabled={!passReason.trim()}>
                  Confirm Pass
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowPassForm(false); setPassReason(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!isPassed && (
          <div className="border-t border-[#1e2d4a] px-5 py-4 flex items-center gap-2">
            {canAdvance && (
              <Button variant="primary" size="md" onClick={handleAdvance} className="flex-1">
                Advance → {STAGE_LABELS[nextStage(liveDeal.stage)!]}
              </Button>
            )}
            {!showPassForm && (
              <Button variant="danger" size="md" onClick={() => setShowPassForm(true)}>
                Pass
              </Button>
            )}
          </div>
        )}
        {isPassed && (
          <div className="border-t border-[#1e2d4a] px-5 py-4">
            <p className="text-xs text-slate-500 text-center">This deal has been {liveDeal.stage}.</p>
          </div>
        )}
      </div>
    </>
  );
}
