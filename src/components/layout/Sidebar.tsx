"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useSimulation } from "@/store/simulationStore";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⬛" },
  { href: "/fund", label: "Fund", icon: "🏛" },
  { href: "/fundraising", label: "Fundraising", icon: "💼" },
  { href: "/pipeline", label: "Pipeline", icon: "📊" },
  { href: "/tasks", label: "Tasks", icon: "✓" },
  { href: "/crm", label: "CRM", icon: "👥" },
  { href: "/modeling", label: "Modeling", icon: "📈" },
  { href: "/learning", label: "Learning", icon: "📚" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { state } = useSimulation();

  const openTasks = state.tasks.filter((t) => t.status === "open").length;
  const missedTasks = state.tasks.filter((t) => t.status === "missed").length;

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-[#1e2d4a] bg-[#080d1c]">
      {/* Logo */}
      <div className="border-b border-[#1e2d4a] px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">PE Fund</p>
        <p className="text-sm font-semibold text-slate-100">Simulator</p>
      </div>

      {/* Fund name */}
      <div className="border-b border-[#1e2d4a] px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">Active Fund</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-300">{state.fund.name}</p>
        <div className="mt-1.5 flex items-center gap-1">
          <div className="h-1 flex-1 rounded-full bg-[#1a2540]">
            <div
              className="h-1 rounded-full bg-blue-500"
              style={{ width: `${Math.min(100, (state.fund.committedCapital / state.fund.targetSize) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">
            {Math.round((state.fund.committedCapital / state.fund.targetSize) * 100)}%
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "mb-0.5 flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-blue-900/40 text-blue-300"
                  : "text-slate-400 hover:bg-[#111827] hover:text-slate-200"
              )}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {item.href === "/tasks" && missedTasks > 0 && (
                <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-red-700 text-[10px] font-bold text-white">
                  {missedTasks}
                </span>
              )}
              {item.href === "/tasks" && missedTasks === 0 && openTasks > 0 && (
                <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-800/80 px-1 text-[10px] font-bold text-blue-300">
                  {openTasks}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Scores */}
      <div className="border-t border-[#1e2d4a] px-4 py-3 space-y-2">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Reputation</span>
            <span className={clsx("text-xs font-bold", state.reputationScore >= 70 ? "text-emerald-400" : state.reputationScore >= 40 ? "text-amber-400" : "text-red-400")}>
              {state.reputationScore}
            </span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-[#1a2540]">
            <div
              className={clsx("h-1 rounded-full", state.reputationScore >= 70 ? "bg-emerald-500" : state.reputationScore >= 40 ? "bg-amber-500" : "bg-red-500")}
              style={{ width: `${state.reputationScore}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Modeling</span>
            <span className="text-xs font-bold text-blue-400">{state.modelingSkillScore}</span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-[#1a2540]">
            <div className="h-1 rounded-full bg-blue-500" style={{ width: `${state.modelingSkillScore}%` }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
