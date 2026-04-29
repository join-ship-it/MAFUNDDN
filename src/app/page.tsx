"use client";

import Link from "next/link";

const features = [
  { icon: "🏛", title: "Fund Management", desc: "Track your Fund I from first close through final deployment. Manage strategy, mandate, and capital allocation." },
  { icon: "💼", title: "LP Fundraising", desc: "Build your LP register, manage DDQs and soft commits, and close capital from family offices, endowments, and pensions." },
  { icon: "📊", title: "Deal Pipeline", desc: "Source, screen, and manage deals from banker teaser to signed purchase agreement — with a full kanban board." },
  { icon: "📈", title: "LBO Modeling", desc: "Interactive return calculator with sensitivity analysis. Build your modeling skill by completing deal tasks." },
  { icon: "✓", title: "Task System", desc: "Stay on top of deadlines with a prioritized task tracker. Miss too many and your reputation suffers." },
  { icon: "⏱", title: "Simulation Time", desc: "Time advances only when you choose. No real-world timers. You control the pace of the fund lifecycle." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070c1a] text-slate-100">
      <nav className="border-b border-[#1e2d4a] px-8 py-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">PE FUND</span>
          <span className="ml-2 text-sm font-semibold text-slate-100">Simulator</span>
        </div>
        <Link
          href="/dashboard"
          className="rounded border border-blue-600 bg-blue-600 hover:bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors"
        >
          Launch Simulator →
        </Link>
      </nav>

      <div className="mx-auto max-w-4xl px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-800/60 bg-blue-900/20 px-3 py-1 text-xs text-blue-400 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Single-Player · Educational · Realistic
        </div>
        <h1 className="text-5xl font-black tracking-tight text-slate-50 mb-6 leading-tight">
          Run a Private Equity Fund<br />
          <span className="text-blue-400">from Raise to Exit.</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          You are a founding team member at Arcadia Capital Partners I — a $150M lower-middle-market
          buyout fund. Manage LP fundraising, source and close deals, build LBO models, and create
          value across the full private equity lifecycle.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg border border-blue-500 bg-blue-600 hover:bg-blue-500 px-8 py-3 text-base font-bold text-white transition-all hover:shadow-lg hover:shadow-blue-900/50"
          >
            Start Simulation →
          </Link>
          <Link
            href="/learning"
            className="rounded-lg border border-[#1e2d4a] hover:border-blue-800 px-8 py-3 text-base font-semibold text-slate-300 transition-colors"
          >
            Learning Center
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-8 pb-16">
        <div className="rounded-xl border border-[#1e2d4a] bg-[#0d1528] p-6">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-4">Your Fund at a Glance</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Fund Name", value: "Arcadia Capital Partners I" },
              { label: "Strategy", value: "Lower Middle Market Buyout" },
              { label: "Target Size", value: "$150M" },
              { label: "Committed", value: "$47M · 31% raised" },
              { label: "Revenue Target", value: "$10M – $75M" },
              { label: "EBITDA Target", value: "$2M – $12M" },
              { label: "Active Deals", value: "7 in pipeline" },
              { label: "Simulation Date", value: "April 29, 2026" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{item.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-200">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-8 pb-24">
        <h2 className="text-2xl font-bold text-slate-200 mb-8 text-center">Full PE Lifecycle Simulation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-[#1e2d4a] bg-[#0d1528] p-5 hover:border-blue-800/50 transition-colors">
              <span className="text-2xl mb-3 block">{f.icon}</span>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">{f.title}</h3>
              <p className="text-[12px] leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#1e2d4a] px-8 py-6 text-center">
        <p className="text-xs text-slate-600">PE Fund Simulator · Educational Use Only · Fictional Fund and Data</p>
      </div>
    </div>
  );
}
