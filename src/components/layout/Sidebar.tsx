"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useState } from "react";
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

function DbIndicator({ status }: { status: import("@/store/simulationStore").DbStatus }) {
  if (status === "unconfigured") return null;
  return (
    <div className="flex items-center gap-1.5">
      {status === "loading" && (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[9px] text-blue-500">connecting</span>
        </>
      )}
      {status === "saving" && (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[9px] text-amber-500">saving</span>
        </>
      )}
      {status === "synced" && (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-emerald-600">synced</span>
        </>
      )}
      {status === "error" && (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          <span className="text-[9px] text-red-500">sync error</span>
        </>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { state, dbStatus, resetSimulation } = useSimulation();
  const [confirmReset, setConfirmReset] = useState(false);

  const openTasks = state.tasks.filter((t) => t.status === "open").length;
  const missedTasks = state.tasks.filter((t) => t.status === "missed").length;
  const pct = Math.min(100, (state.fund.committedCapital / state.fund.targetSize) * 100);

  function handleReset() {
    if (confirmReset) {
      resetSimulation();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
    }
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-[#1e2d4a] bg-[#080d1c]">
      {/* Logo */}
      <div className="border-b border-[#1e2d4a] px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">PE Fund</p>
            <p className="text-sm font-semibold text-slate-100">Simulator</p>
          </div>
          <DbIndicator status={dbStatus} />
        </div>
      </div>

      {/* Fund summary */}
      <div className="border-b border-[#1e2d4a] px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">Active Fund</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-300 leading-tight">{state.fund.name}</p>
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-600">
              ${state.fund.committedCapital}M / ${state.fund.targetSize}M
            </span>
            <span className="text-[10px] text-slate-500">{pct.toFixed(0)}%</span>
          </div>
          <div className="h-1 flex-1 rounded-full bg-[#1a2540]">
            <div
              className="h-1 rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false);
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
            <span className={clsx(
              "text-xs font-bold",
              state.reputationScore >= 70 ? "text-emerald-400" :
              state.reputationScore >= 40 ? "text-amber-400" : "text-red-400"
            )}>
              {state.reputationScore}
            </span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-[#1a2540]">
            <div
              className={clsx(
                "h-1 rounded-full transition-all duration-500",
                state.reputationScore >= 70 ? "bg-emerald-500" :
                state.reputationScore >= 40 ? "bg-amber-500" : "bg-red-500"
              )}
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
            <div
              className="h-1 rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${state.modelingSkillScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="border-t border-[#1e2d4a] px-4 py-3">
        <button
          onClick={handleReset}
          className={clsx(
            "w-full rounded border px-3 py-1.5 text-[11px] font-medium transition-colors",
            confirmReset
              ? "border-red-700 bg-red-900/40 text-red-300"
              : "border-[#1e2d4a] text-slate-600 hover:border-slate-600 hover:text-slate-400"
          )}
        >
          {confirmReset ? "⚠ Click again to confirm reset" : "Reset Simulation"}
        </button>
      </div>
    </aside>
  );
}
