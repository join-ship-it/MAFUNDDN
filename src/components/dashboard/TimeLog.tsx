"use client";

import { clsx } from "clsx";
import { useSimulation } from "@/store/simulationStore";
import { formatShortDate } from "@/lib/dateUtils";
import type { EventFeedItem } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdvanceSession {
  advanceEvent: EventFeedItem;       // the time_advance anchor
  consequences: EventFeedItem[];     // task_missed + reputation_change events
}

// ─── Group event feed into advance sessions ───────────────────────────────────
//
// The store always prepends events in this order for a single advance:
//   [time_advance, reputation_change?, ...task_missed events, ...prior events]
//
// So in the feed (newest first), a time_advance entry is followed by its
// consequences until the next time_advance.
//
function buildSessions(feed: EventFeedItem[]): AdvanceSession[] {
  const sessions: AdvanceSession[] = [];
  let i = 0;

  while (i < feed.length) {
    const evt = feed[i];
    if (evt.type === "time_advance") {
      const consequences: EventFeedItem[] = [];
      let j = i + 1;
      // Collect everything until the next time_advance (or end of feed)
      while (j < feed.length && feed[j].type !== "time_advance") {
        const c = feed[j];
        if (c.type === "task_missed" || c.type === "reputation_change") {
          consequences.push(c);
        }
        j++;
      }
      sessions.push({ advanceEvent: evt, consequences });
      i = j; // skip to next time_advance
    } else {
      i++;
    }
  }

  return sessions;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConsequenceRow({ evt }: { evt: EventFeedItem }) {
  const isMissed = evt.type === "task_missed";
  const isRep = evt.type === "reputation_change";

  return (
    <div className={clsx(
      "ml-6 flex items-start gap-2 border-l py-1.5 pl-3 text-xs",
      isMissed ? "border-red-900/50" : "border-amber-900/50"
    )}>
      <span className={clsx("flex-shrink-0 text-sm leading-none mt-0.5", isMissed ? "text-red-500" : "text-amber-500")}>
        {isMissed ? "⚑" : "↘"}
      </span>
      <div className="flex-1 min-w-0">
        <p className={clsx("font-medium", isMissed ? "text-red-300" : "text-amber-300")}>
          {isMissed ? "Missed: " : ""}{evt.title.replace("Missed deadline: ", "")}
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">{evt.description}</p>
      </div>
      <span className="flex-shrink-0 text-[10px] text-slate-700 font-mono">{formatShortDate(evt.date)}</span>
    </div>
  );
}

function SessionRow({ session, isFirst }: { session: AdvanceSession; isFirst: boolean }) {
  const { advanceEvent, consequences } = session;
  const missedCount = consequences.filter((c) => c.type === "task_missed").length;
  const repChange = consequences.find((c) => c.type === "reputation_change");

  const isStart = advanceEvent.title === "Simulation started" || advanceEvent.title.includes("Simulation started");
  const hasBadNews = missedCount > 0;

  return (
    <div className={clsx("border-b border-[#1a2540] last:border-0", isFirst && "pt-0")}>
      {/* Advance anchor row */}
      <div className={clsx(
        "flex items-start gap-2.5 px-3 py-2.5",
        hasBadNews ? "bg-red-950/10" : "hover:bg-[#0a1020]/40"
      )}>
        {/* Timeline dot */}
        <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
          <div className={clsx(
            "h-2.5 w-2.5 rounded-full border-2",
            isStart ? "border-emerald-500 bg-emerald-900/50" :
            hasBadNews ? "border-red-500 bg-red-900/50" :
            "border-blue-500 bg-blue-900/50"
          )} />
          {consequences.length > 0 && (
            <div className="w-px flex-1 bg-[#1e2d4a] min-h-[12px]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={clsx(
              "text-xs font-semibold",
              isStart ? "text-emerald-300" :
              hasBadNews ? "text-red-300" : "text-slate-300"
            )}>
              {isStart ? "🚀 " : "⏩ "}
              {isStart
                ? advanceEvent.title
                : `Advanced to ${advanceEvent.date}`}
            </p>
            <span className="flex-shrink-0 text-[10px] text-slate-600 font-mono">
              {formatShortDate(advanceEvent.date)}
            </span>
          </div>

          {/* Consequence summary */}
          {(missedCount > 0 || repChange) && (
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              {missedCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded border border-red-800/60 bg-red-950/30 px-1.5 py-0.5 text-[10px] text-red-400 font-medium">
                  ⚑ {missedCount} task{missedCount !== 1 ? "s" : ""} missed
                </span>
              )}
              {repChange && (
                <span className="inline-flex items-center gap-1 rounded border border-amber-800/60 bg-amber-950/30 px-1.5 py-0.5 text-[10px] text-amber-400 font-medium">
                  ↘ {repChange.title}
                </span>
              )}
            </div>
          )}

          {/* Clean advance */}
          {!hasBadNews && !isStart && (
            <p className="mt-0.5 text-[10px] text-emerald-600">No deadlines crossed</p>
          )}
        </div>
      </div>

      {/* Consequence details */}
      {consequences.map((c) => (
        <ConsequenceRow key={c.id} evt={c} />
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function TimeLog() {
  const { state } = useSimulation();
  const sessions = buildSessions(state.eventFeed);

  const totalAdvances = sessions.length;
  const totalMissed = sessions.reduce(
    (s, sess) => s + sess.consequences.filter((c) => c.type === "task_missed").length,
    0
  );

  return (
    <div className="rounded-lg border border-[#1e2d4a] bg-[#0d1528] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e2d4a] px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Time Advancement Log
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">
            {totalAdvances} advance{totalAdvances !== 1 ? "s" : ""} · {totalMissed} missed deadline{totalMissed !== 1 ? "s" : ""}
          </p>
        </div>
        {totalMissed === 0 && totalAdvances > 1 && (
          <span className="text-[10px] font-semibold text-emerald-500">✓ Perfect record</span>
        )}
        {totalMissed > 0 && (
          <span className="text-[10px] font-semibold text-red-400">
            {totalMissed} missed
          </span>
        )}
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto max-h-[460px]">
        {sessions.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-slate-600">
            No time advances recorded yet.
          </div>
        )}
        {sessions.map((session, i) => (
          <SessionRow key={session.advanceEvent.id} session={session} isFirst={i === 0} />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-[#1e2d4a] px-4 py-2">
        <p className="text-[10px] text-slate-600">
          ⚑ = deadline missed when time advanced past it · ↘ = reputation impact
        </p>
      </div>
    </div>
  );
}
