"use client";

import { useSimulation } from "@/store/simulationStore";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-[#1a2540] py-2.5 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-200">{value}</span>
    </div>
  );
}

export default function FundPage() {
  const { state } = useSimulation();
  const { fund } = state;

  const pct = (fund.committedCapital / fund.targetSize) * 100;
  const portfolioDeals = state.deals.filter((d) => d.stage === "portfolio");
  const totalPortfolioEV = portfolioDeals.reduce((s, d) => s + d.impliedEV, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Fund Overview" />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{fund.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{fund.strategy} · {fund.geography} · Vintage {fund.vintage}</p>
          </div>
          <Badge variant={fund.fundingStatus === "fundraising" ? "warning" : fund.fundingStatus === "closed" ? "positive" : "info"}>
            {fund.fundingStatus.replace("_", " ")}
          </Badge>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Fund Target" value={`$${fund.targetSize}M`} />
          <StatTile label="Committed" value={`$${fund.committedCapital}M`} sub={`${pct.toFixed(1)}% raised`} accent trend="up" />
          <StatTile label="Called Capital" value={`$${fund.calledCapital}M`} sub={`${((fund.calledCapital / fund.committedCapital) * 100).toFixed(0)}% of committed`} />
          <StatTile label="Portfolio EV" value={`$${totalPortfolioEV}M`} sub={`${portfolioDeals.length} platform(s)`} />
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Fund Terms */}
          <Card className="col-span-12 xl:col-span-4">
            <CardHeader><CardTitle>Fund Terms</CardTitle></CardHeader>
            <InfoRow label="Management Fee" value={`${fund.managementFee}%`} />
            <InfoRow label="Carried Interest" value={`${fund.carry}%`} />
            <InfoRow label="Investment Period" value={`${fund.investmentPeriodYears} years`} />
            <InfoRow label="Fund Life" value={`${fund.fundLifeYears} years`} />
            <InfoRow label="Vintage Year" value={fund.vintage} />
          </Card>

          {/* Mandate */}
          <Card className="col-span-12 xl:col-span-4">
            <CardHeader><CardTitle>Investment Mandate</CardTitle></CardHeader>
            <InfoRow label="Sector Focus" value={fund.sector} />
            <InfoRow label="Geography" value={fund.geography} />
            <InfoRow label="Revenue Range" value={`$${fund.revenueMin}M – $${fund.revenueMax}M`} />
            <InfoRow label="EBITDA Range" value={`$${fund.ebitdaMin}M – $${fund.ebitdaMax}M`} />
            <InfoRow label="Target Deals" value="4 – 6 platforms" />
          </Card>

          {/* Capital Allocation */}
          <Card className="col-span-12 xl:col-span-4">
            <CardHeader><CardTitle>Capital Deployment</CardTitle></CardHeader>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Fundraising Progress</span>
                  <span className="text-slate-200 font-semibold">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1a2540]">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Capital Called</span>
                  <span className="text-slate-200 font-semibold">{((fund.calledCapital / fund.committedCapital) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1a2540]">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(fund.calledCapital / fund.committedCapital) * 100}%` }} />
                </div>
              </div>
              <div className="pt-2 border-t border-[#1a2540] space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Dry Powder</span>
                  <span className="text-slate-200 font-semibold">${(fund.committedCapital - fund.calledCapital).toFixed(0)}M</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Remaining Target</span>
                  <span className="text-slate-200 font-semibold">${(fund.targetSize - fund.committedCapital).toFixed(0)}M</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Portfolio companies */}
          <Card className="col-span-12">
            <CardHeader>
              <CardTitle>Portfolio Companies</CardTitle>
            </CardHeader>
            {portfolioDeals.length === 0 && (
              <p className="text-sm text-slate-500 py-4">No portfolio companies yet.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {portfolioDeals.map((d) => (
                <div key={d.id} className="rounded border border-[#1a2540] bg-[#0a1020] p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">{d.companyName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{d.sector} · Entry ${d.impliedEV}M EV</p>
                    </div>
                    <Badge variant="positive">Portfolio</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">Revenue</p>
                      <p className="text-xs font-bold text-slate-200">${d.revenue}M</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">EBITDA</p>
                      <p className="text-xs font-bold text-slate-200">${d.ebitda}M</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">Proj MOIC</p>
                      <p className="text-xs font-bold text-slate-200">{d.moic ?? "—"}x</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
