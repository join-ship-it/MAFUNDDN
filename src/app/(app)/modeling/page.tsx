"use client";

import { useState } from "react";
import { useSimulation } from "@/store/simulationStore";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";

interface LBOInputs {
  entryEV: number;
  entryDebt: number;
  revenueGrowth: number;
  ebitdaMarginExit: number;
  exitMultiple: number;
  holdYears: number;
}

function calcLBO(inputs: LBOInputs) {
  const entryEquity = inputs.entryEV - inputs.entryDebt;
  const entryEbitda = (inputs.entryEV / 7.5); // approximate
  const exitRevenue = entryEbitda / 0.15 * Math.pow(1 + inputs.revenueGrowth / 100, inputs.holdYears);
  const exitEbitda = exitRevenue * (inputs.ebitdaMarginExit / 100);
  const exitEV = exitEbitda * inputs.exitMultiple;
  const exitDebt = inputs.entryDebt * 0.5; // assume half paid down
  const exitEquity = Math.max(0, exitEV - exitDebt);
  const moic = entryEquity > 0 ? exitEquity / entryEquity : 0;
  const irr = entryEquity > 0 ? (Math.pow(moic, 1 / inputs.holdYears) - 1) * 100 : 0;
  return {
    entryEquity: entryEquity.toFixed(1),
    exitEV: exitEV.toFixed(1),
    exitEquity: exitEquity.toFixed(1),
    moic: moic.toFixed(2),
    irr: irr.toFixed(1),
    exitEbitda: exitEbitda.toFixed(1),
  };
}

export default function ModelingPage() {
  const { state, completeTask } = useSimulation();
  const { deals, tasks, modelingSkillScore } = state;

  const [inputs, setInputs] = useState<LBOInputs>({
    entryEV: 54,
    entryDebt: 27,
    revenueGrowth: 8,
    ebitdaMarginExit: 16,
    exitMultiple: 7.5,
    holdYears: 5,
  });

  const results = calcLBO(inputs);
  const modelingTasks = tasks.filter((t) => t.category === "modeling" && t.status === "open");

  const moicNum = parseFloat(results.moic);
  const irrNum = parseFloat(results.irr);

  function SliderRow({
    label, field, min, max, step, format
  }: {
    label: string;
    field: keyof LBOInputs;
    min: number;
    max: number;
    step: number;
    format: (v: number) => string;
  }) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">{label}</span>
          <span className="text-xs font-semibold text-slate-200">{format(inputs[field])}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={inputs[field]}
          onChange={(e) => setInputs((prev) => ({ ...prev, [field]: parseFloat(e.target.value) }))}
          className="w-full h-1.5 appearance-none rounded-full bg-[#1a2540] accent-blue-500 cursor-pointer"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="LBO Modeling" />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Modeling Skill" value={modelingSkillScore} sub="Complete tasks to level up" accent />
          <StatTile label="Models Built" value={tasks.filter(t => t.category === "modeling" && t.status === "completed").length} />
          <StatTile label="Open Modeling Tasks" value={modelingTasks.length} />
          <StatTile label="Avg Deal IRR" value={`${(deals.filter(d => d.irr).reduce((s, d) => s + (d.irr ?? 0), 0) / Math.max(deals.filter(d => d.irr).length, 1)).toFixed(0)}%`} sub="Projected" trend="up" />
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* LBO Calculator */}
          <Card className="col-span-12 xl:col-span-5">
            <CardHeader>
              <CardTitle>LBO Return Calculator</CardTitle>
              <Badge variant="info">Interactive</Badge>
            </CardHeader>
            <div className="space-y-4">
              <SliderRow label="Entry EV ($M)" field="entryEV" min={10} max={200} step={1} format={(v) => `$${v}M`} />
              <SliderRow label="Entry Debt ($M)" field="entryDebt" min={0} max={150} step={1} format={(v) => `$${v}M`} />
              <SliderRow label="Revenue Growth (% p.a.)" field="revenueGrowth" min={-5} max={25} step={0.5} format={(v) => `${v}%`} />
              <SliderRow label="Exit EBITDA Margin (%)" field="ebitdaMarginExit" min={5} max={35} step={0.5} format={(v) => `${v}%`} />
              <SliderRow label="Exit Multiple (EV/EBITDA)" field="exitMultiple" min={4} max={14} step={0.25} format={(v) => `${v}x`} />
              <SliderRow label="Hold Period (years)" field="holdYears" min={2} max={10} step={1} format={(v) => `${v}yr`} />
            </div>
          </Card>

          {/* Results */}
          <Card className="col-span-12 xl:col-span-4">
            <CardHeader><CardTitle>Model Output</CardTitle></CardHeader>
            <div className="space-y-3">
              <div className="rounded border border-[#1a2540] bg-[#070c1a] p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Projected IRR</p>
                <p className={`text-4xl font-black mt-1 ${irrNum >= 25 ? "text-emerald-400" : irrNum >= 15 ? "text-amber-400" : "text-red-400"}`}>
                  {results.irr}%
                </p>
                <p className={`text-[11px] mt-1 ${irrNum >= 25 ? "text-emerald-600" : irrNum >= 15 ? "text-amber-600" : "text-red-600"}`}>
                  {irrNum >= 25 ? "Above hurdle — strong deal" : irrNum >= 15 ? "Marginal — negotiate harder" : "Below hurdle — pass or restructure"}
                </p>
              </div>

              <div className="rounded border border-[#1a2540] bg-[#070c1a] p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">MOIC</p>
                <p className={`text-4xl font-black mt-1 ${moicNum >= 2.5 ? "text-emerald-400" : moicNum >= 1.5 ? "text-amber-400" : "text-red-400"}`}>
                  {results.moic}x
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between border-b border-[#1a2540] py-1.5">
                  <span className="text-slate-500">Entry Equity Check</span>
                  <span className="font-semibold text-slate-200">${results.entryEquity}M</span>
                </div>
                <div className="flex justify-between border-b border-[#1a2540] py-1.5">
                  <span className="text-slate-500">Exit EV</span>
                  <span className="font-semibold text-slate-200">${results.exitEV}M</span>
                </div>
                <div className="flex justify-between border-b border-[#1a2540] py-1.5">
                  <span className="text-slate-500">Exit EBITDA</span>
                  <span className="font-semibold text-slate-200">${results.exitEbitda}M</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Exit Equity Proceeds</span>
                  <span className="font-semibold text-emerald-400">${results.exitEquity}M</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Deal Models */}
          <Card className="col-span-12 xl:col-span-3">
            <CardHeader><CardTitle>Deal Models</CardTitle></CardHeader>
            <div className="space-y-2">
              {deals.filter(d => d.irr || d.moic).map((deal) => (
                <div key={deal.id} className="rounded border border-[#1a2540] bg-[#0a1020] p-2.5">
                  <p className="text-xs font-semibold text-slate-200">{deal.companyName}</p>
                  <div className="mt-1 flex items-center gap-3 text-[11px]">
                    <span className="text-slate-500">IRR: <span className="text-emerald-400 font-bold">{deal.irr ? `${deal.irr}%` : "—"}</span></span>
                    <span className="text-slate-500">MOIC: <span className="text-emerald-400 font-bold">{deal.moic ? `${deal.moic}x` : "—"}</span></span>
                  </div>
                </div>
              ))}
            </div>

            {modelingTasks.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#1a2540]">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Pending Modeling Tasks</p>
                {modelingTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400 flex-1 truncate mr-2">{t.title}</span>
                    <Button size="sm" variant="success" onClick={() => completeTask(t.id)}>Done</Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
