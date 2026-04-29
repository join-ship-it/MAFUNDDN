"use client";

import { useSimulation } from "@/store/simulationStore";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { clsx } from "clsx";

const MODULES = [
  {
    id: "m1",
    title: "LBO Modeling Fundamentals",
    category: "Modeling",
    level: "Beginner",
    description: "Build a three-statement LBO model from scratch. Understand entry/exit mechanics, debt schedules, and returns attribution.",
    topics: ["Sources & Uses", "Debt Schedule", "Returns Analysis", "Sensitivity Tables"],
    xp: 20,
    completed: true,
  },
  {
    id: "m2",
    title: "Deal Sourcing & Origination",
    category: "Origination",
    level: "Beginner",
    description: "Learn how lower-middle-market PE funds generate proprietary deal flow through banker relationships, direct outreach, and referral networks.",
    topics: ["Banker Coverage", "Direct Outreach", "CRM Discipline", "Process Management"],
    xp: 15,
    completed: true,
  },
  {
    id: "m3",
    title: "Quality of Earnings (QofE)",
    category: "Due Diligence",
    level: "Intermediate",
    description: "Understand what a Quality of Earnings report covers, how to review add-back schedules, and identify red flags in seller-prepared financials.",
    topics: ["EBITDA Normalization", "Add-Back Analysis", "Working Capital", "Revenue Quality"],
    xp: 25,
    completed: false,
  },
  {
    id: "m4",
    title: "LP Fundraising & Investor Relations",
    category: "Fundraising",
    level: "Intermediate",
    description: "How to pitch institutional LPs, structure a fund close, manage DDQ responses, and maintain investor relationships through the fund lifecycle.",
    topics: ["Fund Deck", "DDQ Responses", "LP Tiering", "Capital Call Process"],
    xp: 20,
    completed: false,
  },
  {
    id: "m5",
    title: "Purchase Agreement & Closing",
    category: "Legal",
    level: "Intermediate",
    description: "Navigate the purchase agreement (SPA/APA), rep and warranty insurance, indemnification baskets, and the closing checklist.",
    topics: ["SPA vs APA", "Reps & Warranties", "Indemnification", "RWI Insurance"],
    xp: 25,
    completed: false,
  },
  {
    id: "m6",
    title: "100-Day Value Creation Planning",
    category: "Portfolio Ops",
    level: "Intermediate",
    description: "Design and execute a 100-day plan post-close: quick wins, strategic hires, KPI tracking, and management alignment.",
    topics: ["Quick Wins", "Org Assessment", "KPI Dashboard", "Management Incentives"],
    xp: 20,
    completed: false,
  },
  {
    id: "m7",
    title: "Add-On Acquisition Strategy",
    category: "M&A",
    level: "Advanced",
    description: "How to identify, evaluate, and integrate add-on acquisitions to build a platform and drive multiple expansion at exit.",
    topics: ["Target Screening", "Integration Risk", "Multiple Expansion", "Synergy Analysis"],
    xp: 30,
    completed: false,
  },
  {
    id: "m8",
    title: "Exit Strategy & Process Management",
    category: "Exits",
    level: "Advanced",
    description: "Timing an exit, selecting a sell-side advisor, managing the auction process, and structuring the management team rollover.",
    topics: ["Exit Timing", "Auction Process", "Management Rollover", "Buyer Positioning"],
    xp: 35,
    completed: false,
  },
];

const LEVEL_COLOR: Record<string, string> = {
  Beginner: "text-emerald-400 border-emerald-800 bg-emerald-900/30",
  Intermediate: "text-amber-400 border-amber-800 bg-amber-900/30",
  Advanced: "text-purple-400 border-purple-800 bg-purple-900/30",
};

export default function LearningPage() {
  const { state } = useSimulation();
  const { modelingSkillScore } = state;

  const completed = MODULES.filter((m) => m.completed).length;
  const totalXP = MODULES.filter((m) => m.completed).reduce((s, m) => s + m.xp, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="PE Learning Center" />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Modules Completed" value={`${completed}/${MODULES.length}`} sub="Keep learning" accent />
          <StatTile label="XP Earned" value={totalXP} sub={`${MODULES.reduce((s, m) => s + m.xp, 0) - totalXP} XP remaining`} trend="up" />
          <StatTile label="Modeling Skill" value={modelingSkillScore} sub="Increases with tasks" />
          <StatTile label="Level" value={modelingSkillScore >= 75 ? "Senior" : modelingSkillScore >= 50 ? "Associate" : "Analyst"} sub="Based on skill score" />
        </div>

        {/* Skill progress */}
        <Card>
          <CardHeader><CardTitle>Skill Progression</CardTitle></CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { skill: "LBO Modeling", score: modelingSkillScore },
              { skill: "Due Diligence", score: 40 },
              { skill: "Fundraising", score: 35 },
              { skill: "Deal Sourcing", score: 50 },
              { skill: "Portfolio Ops", score: 25 },
              { skill: "Negotiations", score: 30 },
            ].map((s) => (
              <div key={s.skill} className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a2540" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={s.score >= 70 ? "#10b981" : s.score >= 40 ? "#f59e0b" : "#3b82f6"}
                      strokeWidth="3"
                      strokeDasharray={`${s.score} ${100 - s.score}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-sm font-bold text-slate-200">{s.score}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{s.skill}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MODULES.map((mod) => (
            <Card
              key={mod.id}
              className={clsx(
                "transition-all",
                mod.completed ? "border-emerald-900/40 opacity-80" : "hover:border-blue-800/60"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={mod.completed ? "positive" : "muted"}>
                    {mod.completed ? "✓ Done" : `+${mod.xp} XP`}
                  </Badge>
                  <span className={clsx("text-[10px] font-medium rounded border px-1.5 py-0.5", LEVEL_COLOR[mod.level])}>
                    {mod.level}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">{mod.category}</span>
              </div>

              <h3 className={clsx("text-sm font-semibold mb-1", mod.completed ? "text-slate-400" : "text-slate-200")}>
                {mod.title}
              </h3>
              <p className="text-[11px] leading-relaxed text-slate-500 mb-3">{mod.description}</p>

              <div className="flex flex-wrap gap-1">
                {mod.topics.map((t) => (
                  <span key={t} className="rounded bg-[#1a2540] px-2 py-0.5 text-[10px] text-slate-400">
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="border-blue-900/40 bg-blue-950/10">
          <p className="text-xs font-semibold text-blue-300">How Learning Works</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Complete modeling tasks in the simulator to increase your Modeling Skill score. Each module teaches the concepts behind
            what you practice. Completing deals, closing LPs, and meeting deadlines earns XP and unlocks advanced scenarios.
          </p>
        </Card>
      </div>
    </div>
  );
}
