"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useSimulation } from "@/store/simulationStore";
import {
  OnboardingChoices,
  DEFAULT_CHOICES,
  TARGET_SIZE_OPTIONS,
  SECTOR_OPTIONS,
  EBITDA_OPTIONS,
  GEOGRAPHY_OPTIONS,
  VALUE_CREATION_OPTIONS,
  RISK_OPTIONS,
  buildInitialState,
  ONBOARDING_STORAGE_KEY,
} from "@/lib/onboardingData";

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEP_COUNT = 8;

const STEP_LABELS = [
  "Fund Name",
  "Target Size",
  "Sector",
  "EBITDA Range",
  "Geography",
  "Value Creation",
  "Risk Appetite",
  "Review & Launch",
];

// ─── Shared option card ───────────────────────────────────────────────────────

function OptionCard({
  selected,
  onClick,
  label,
  desc,
  recommended,
  multi,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc?: string;
  recommended?: boolean;
  multi?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative w-full rounded-lg border p-4 text-left transition-all",
        selected
          ? "border-blue-500 bg-blue-900/20 ring-1 ring-blue-500/40"
          : "border-[#1e2d4a] bg-[#0d1528] hover:border-blue-800/60 hover:bg-[#111d35]"
      )}
    >
      {recommended && (
        <span className="absolute right-3 top-3 rounded-full bg-blue-900/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
          Recommended
        </span>
      )}
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            "mt-0.5 flex-shrink-0 rounded transition-colors",
            multi ? "h-4 w-4 rounded" : "h-4 w-4 rounded-full",
            selected ? "border-2 border-blue-500 bg-blue-500" : "border-2 border-slate-600"
          )}
        />
        <div>
          <p className={clsx("text-sm font-semibold", selected ? "text-slate-100" : "text-slate-300")}>
            {label}
          </p>
          {desc && (
            <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { initializeFund } = useSimulation();

  const [step, setStep] = useState(1);
  const [choices, setChoices] = useState<OnboardingChoices>({ ...DEFAULT_CHOICES });
  const [launching, setLaunching] = useState(false);

  // If already onboarded, skip to dashboard
  useEffect(() => {
    try {
      if (localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
        router.replace("/dashboard");
      }
    } catch {
      // ignore
    }
  }, [router]);

  function applyDefaults() {
    setChoices({ ...DEFAULT_CHOICES });
    setStep(8);
  }

  function canAdvance(): boolean {
    if (step === 1) return choices.fundName.trim().length >= 3;
    if (step === 6) return choices.valueCreation.length >= 1;
    return true;
  }

  function handleLaunch() {
    setLaunching(true);
    const state = buildInitialState(choices);
    initializeFund(state);
    router.push("/dashboard");
  }

  function toggleValueCreation(val: string) {
    setChoices((prev) => ({
      ...prev,
      valueCreation: prev.valueCreation.includes(val)
        ? prev.valueCreation.filter((v) => v !== val)
        : [...prev.valueCreation, val],
    }));
  }

  const progress = (step / STEP_COUNT) * 100;

  return (
    <div className="min-h-screen bg-[#070c1a] text-slate-100 flex flex-col">
      {/* Header */}
      <div className="border-b border-[#1e2d4a] px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">PE FUND</span>
          <span className="ml-2 text-sm font-semibold text-slate-100">Simulator</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Step {step} of {STEP_COUNT}
          </span>
          <button
            onClick={applyDefaults}
            className="rounded border border-[#1e2d4a] bg-[#0d1528] px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-blue-800/60 hover:text-slate-200"
          >
            Use Recommended Strategy
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-[#1e2d4a]">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="border-b border-[#1e2d4a] px-6 py-3 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {STEP_LABELS.map((label, i) => {
            const s = i + 1;
            const done = s < step;
            const active = s === step;
            return (
              <div key={s} className="flex items-center gap-1">
                <button
                  onClick={() => s < step && setStep(s)}
                  className={clsx(
                    "flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors",
                    active ? "text-blue-400" : done ? "cursor-pointer text-slate-400 hover:text-slate-200" : "text-slate-600 cursor-default"
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                      active ? "bg-blue-600 text-white" : done ? "bg-slate-700 text-slate-300" : "bg-[#1e2d4a] text-slate-600"
                    )}
                  >
                    {done ? "✓" : s}
                  </span>
                  {label}
                </button>
                {s < STEP_COUNT && <span className="text-[#1e2d4a] text-xs">›</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">

          {/* ── Step 1: Fund Name ── */}
          {step === 1 && (
            <StepShell
              title="Name your fund"
              subtitle="Choose a name for your new private equity fund. This will appear throughout the simulator."
            >
              <div>
                <input
                  type="text"
                  value={choices.fundName}
                  onChange={(e) => setChoices((p) => ({ ...p, fundName: e.target.value }))}
                  placeholder="e.g. Arcadia Capital Partners I"
                  className="w-full rounded-lg border border-[#1e2d4a] bg-[#0d1528] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                />
                <p className="mt-2 text-xs text-slate-600">
                  Tip: Most LMM funds use a location/concept name + "Capital Partners" + fund number.
                </p>
              </div>
              <div className="mt-4 rounded-lg border border-[#1e2d4a] bg-[#0a1020] p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Quick start</p>
                <div className="flex flex-wrap gap-2">
                  {["Arcadia Capital Partners I", "Summit Ridge Partners I", "Clearwater Capital I", "Meridian Equity Partners I"].map((name) => (
                    <button
                      key={name}
                      onClick={() => setChoices((p) => ({ ...p, fundName: name }))}
                      className={clsx(
                        "rounded border px-2.5 py-1 text-xs transition-colors",
                        choices.fundName === name
                          ? "border-blue-500 bg-blue-900/20 text-blue-300"
                          : "border-[#1e2d4a] text-slate-500 hover:border-blue-800/60 hover:text-slate-300"
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </StepShell>
          )}

          {/* ── Step 2: Target Size ── */}
          {step === 2 && (
            <StepShell
              title="Set fund target size"
              subtitle="How much capital are you targeting to raise for Fund I?"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TARGET_SIZE_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={choices.targetSize === opt.value}
                    onClick={() => setChoices((p) => ({ ...p, targetSize: opt.value }))}
                    label={opt.label}
                    desc={opt.desc}
                    recommended={opt.recommended}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {/* ── Step 3: Sector ── */}
          {step === 3 && (
            <StepShell
              title="Choose sector focus"
              subtitle="Which sector will you specialize in? This shapes your deal flow and banker network."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SECTOR_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={choices.sector === opt.value}
                    onClick={() => setChoices((p) => ({ ...p, sector: opt.value }))}
                    label={opt.label}
                    desc={opt.desc}
                    recommended={opt.recommended}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {/* ── Step 4: EBITDA Range ── */}
          {step === 4 && (
            <StepShell
              title="Target EBITDA range"
              subtitle="What EBITDA range will your mandate target? This defines the size of deals you pursue."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {EBITDA_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.label}
                    selected={choices.ebitdaMin === opt.min && choices.ebitdaMax === opt.max}
                    onClick={() => setChoices((p) => ({ ...p, ebitdaMin: opt.min, ebitdaMax: opt.max }))}
                    label={opt.label}
                    desc={opt.desc}
                    recommended={opt.recommended}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {/* ── Step 5: Geography ── */}
          {step === 5 && (
            <StepShell
              title="Choose geography"
              subtitle="Where will your fund invest? A tighter focus sharpens the thesis."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {GEOGRAPHY_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={choices.geography === opt.value}
                    onClick={() => setChoices((p) => ({ ...p, geography: opt.value }))}
                    label={opt.label}
                    desc={opt.desc}
                    recommended={opt.recommended}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {/* ── Step 6: Value Creation ── */}
          {step === 6 && (
            <StepShell
              title="Value creation strategy"
              subtitle="How will you create value in portfolio companies? Select all that apply."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {VALUE_CREATION_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={choices.valueCreation.includes(opt.value)}
                    onClick={() => toggleValueCreation(opt.value)}
                    label={opt.label}
                    desc={opt.desc}
                    recommended={DEFAULT_CHOICES.valueCreation.includes(opt.value)}
                    multi
                  />
                ))}
              </div>
              {choices.valueCreation.length === 0 && (
                <p className="mt-3 text-xs text-amber-400">Select at least one strategy to continue.</p>
              )}
            </StepShell>
          )}

          {/* ── Step 7: Risk Appetite ── */}
          {step === 7 && (
            <StepShell
              title="Risk appetite"
              subtitle="What is your fund's risk tolerance? This affects deal structuring and return targets."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {RISK_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={choices.riskAppetite === opt.value}
                    onClick={() => setChoices((p) => ({ ...p, riskAppetite: opt.value }))}
                    label={opt.label}
                    desc={opt.desc}
                    recommended={opt.recommended}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {/* ── Step 8: Review & Launch ── */}
          {step === 8 && (
            <StepShell
              title="Review your fund"
              subtitle="Confirm your fund configuration. You can adjust settings later in the Fund page."
            >
              <div className="rounded-lg border border-[#1e2d4a] bg-[#0d1528] divide-y divide-[#1e2d4a]">
                <ReviewRow label="Fund Name" value={choices.fundName} onEdit={() => setStep(1)} />
                <ReviewRow label="Target Size" value={`$${choices.targetSize}M`} onEdit={() => setStep(2)} />
                <ReviewRow label="Sector Focus" value={choices.sector} onEdit={() => setStep(3)} />
                <ReviewRow
                  label="EBITDA Range"
                  value={`$${choices.ebitdaMin}M – $${choices.ebitdaMax}M`}
                  onEdit={() => setStep(4)}
                />
                <ReviewRow label="Geography" value={choices.geography} onEdit={() => setStep(5)} />
                <ReviewRow
                  label="Value Creation"
                  value={choices.valueCreation
                    .map((v) => VALUE_CREATION_OPTIONS.find((o) => o.value === v)?.label ?? v)
                    .join(", ")}
                  onEdit={() => setStep(6)}
                />
                <ReviewRow
                  label="Risk Appetite"
                  value={RISK_OPTIONS.find((o) => o.value === choices.riskAppetite)?.label ?? choices.riskAppetite}
                  onEdit={() => setStep(7)}
                />
              </div>

              <div className="mt-6 rounded-lg border border-[#1e2d4a] bg-[#0a1020] p-4">
                <p className="text-xs font-semibold text-slate-400 mb-2">What happens when you launch</p>
                <ul className="space-y-1">
                  {[
                    "Fund profile created with your settings",
                    "Simulation starts at Week 1, Day 1",
                    `${LP_TEMPLATES_PREVIEW} LP prospects added to your pipeline`,
                    "Sector-focused banker CRM contacts created",
                    "6 initial tasks queued for Week 1",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-500">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleLaunch}
                disabled={launching}
                className="mt-6 w-full rounded-lg border border-blue-500 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-blue-900/50"
              >
                {launching ? "Launching…" : `Launch ${choices.fundName} →`}
              </button>
            </StepShell>
          )}

          {/* Navigation */}
          {step < 8 && (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="rounded border border-[#1e2d4a] bg-[#0d1528] px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:border-blue-800/60 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep((s) => Math.min(STEP_COUNT, s + 1))}
                disabled={!canAdvance()}
                className="rounded-lg border border-blue-500 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 text-sm font-semibold text-white transition-all"
              >
                {step === 7 ? "Review →" : "Next →"}
              </button>
            </div>
          )}
          {step === 8 && (
            <div className="mt-4 flex justify-start">
              <button
                onClick={() => setStep(7)}
                className="rounded border border-[#1e2d4a] bg-[#0d1528] px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:border-blue-800/60 hover:text-slate-200"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

const LP_TEMPLATES_PREVIEW = 5;

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-50 mb-1">{title}</h1>
      <p className="text-sm text-slate-400 mb-8">{subtitle}</p>
      {children}
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <p className="text-xs text-slate-500 shrink-0 w-28">{label}</p>
      <p className="text-sm text-slate-200 flex-1">{value}</p>
      <button
        onClick={onEdit}
        className="shrink-0 text-[11px] text-blue-500 hover:text-blue-400 transition-colors"
      >
        Edit
      </button>
    </div>
  );
}
