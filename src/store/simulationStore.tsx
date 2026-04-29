"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import type { SimulationState, Task, EventFeedItem, DealStage, LPStatus } from "@/lib/types";
import { INITIAL_STATE } from "@/lib/seedData";
import { addDays, isBefore } from "@/lib/dateUtils";
import { supabase } from "@/lib/supabase/client";
import { loadStateFromSupabase, saveStateToSupabase } from "@/lib/supabase/sync";

// ─── Notification (toast) types ──────────────────────────────────────────────

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

// ─── DB sync status ───────────────────────────────────────────────────────────

export type DbStatus = "unconfigured" | "loading" | "synced" | "saving" | "error";

// ─── Action types ─────────────────────────────────────────────────────────────

type Action =
  | { type: "ADVANCE_DAYS"; payload: number }
  | { type: "ADVANCE_TO_DATE"; payload: string }
  | { type: "COMPLETE_TASK"; payload: string }
  | { type: "ADD_EVENT"; payload: EventFeedItem }
  | { type: "ADVANCE_DEAL_STAGE"; payload: { dealId: string } }
  | { type: "PASS_DEAL"; payload: { dealId: string; reason: string } }
  | { type: "ADVANCE_LP_STATUS"; payload: { lpId: string } }
  | { type: "LOG_LP_CONTACT"; payload: { lpId: string; note: string } }
  | { type: "LOG_BANKER_CONTACT"; payload: { bankerId: string } }
  | { type: "ADD_TASK"; payload: Omit<Task, "id" | "status"> }
  | { type: "HYDRATE"; payload: SimulationState }
  | { type: "RESET" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function event(
  date: string,
  type: EventFeedItem["type"],
  title: string,
  description: string,
  impact: EventFeedItem["impact"] = "neutral"
): EventFeedItem {
  return { id: `evt-${uid()}`, date, type, title, description, impact };
}

// Stage transition metadata
const STAGE_SEQUENCE: DealStage[] = [
  "sourced",
  "initial_review",
  "loi_sent",
  "due_diligence",
  "negotiation",
  "closing",
  "portfolio",
];

const STAGE_LABELS: Record<DealStage, string> = {
  sourced: "Sourced",
  initial_review: "Initial Review",
  loi_sent: "LOI Sent",
  due_diligence: "Due Diligence",
  negotiation: "Negotiation",
  closing: "Closing",
  portfolio: "Portfolio",
  exited: "Exited",
  passed: "Passed",
};

function nextStage(current: DealStage): DealStage | null {
  const idx = STAGE_SEQUENCE.indexOf(current);
  if (idx === -1 || idx >= STAGE_SEQUENCE.length - 1) return null;
  return STAGE_SEQUENCE[idx + 1];
}

// Auto-generated task when a deal advances to a new stage
function stageTask(
  dealId: string,
  companyName: string,
  newStage: DealStage,
  currentDate: string
): Task | null {
  const daysMap: Partial<Record<DealStage, number>> = {
    initial_review: 7,
    loi_sent: 5,
    due_diligence: 21,
    negotiation: 10,
    closing: 14,
    portfolio: 30,
  };
  const titleMap: Partial<Record<DealStage, string>> = {
    initial_review: `Review CIM — ${companyName}`,
    loi_sent: `Submit LOI — ${companyName}`,
    due_diligence: `Kick off QofE & legal diligence — ${companyName}`,
    negotiation: `Finalize purchase price negotiation — ${companyName}`,
    closing: `Complete SPA and closing checklist — ${companyName}`,
    portfolio: `Launch 100-day value creation plan — ${companyName}`,
  };
  const descMap: Partial<Record<DealStage, string>> = {
    initial_review: "Screen the CIM against mandate. Identify key risks and initial sizing. Decide on management call.",
    loi_sent: "Prepare LOI with proposed EV range, exclusivity terms, and key diligence conditions.",
    due_diligence: "Coordinate QofE, legal, environmental, and commercial diligence workstreams.",
    negotiation: "Negotiate final price, reps/warranties, and working capital peg with seller.",
    closing: "Track SPA execution, financing, board approvals, and pre-close conditions.",
    portfolio: "Execute 100-day plan: CFO hire, management incentive plan, KPI dashboard, quick wins.",
  };
  const title = titleMap[newStage];
  if (!title) return null;
  const days = daysMap[newStage] ?? 14;
  const dueDate = addDays(currentDate, days);
  return {
    id: `task-auto-${uid()}`,
    title,
    description: descMap[newStage] ?? "",
    category: newStage === "portfolio" ? "operations" : "deal",
    priority: "high",
    status: "open",
    dueDate,
    linkedDealId: dealId,
  };
}

// LP status progression
const LP_STATUS_SEQUENCE: LPStatus[] = ["prospect", "soft_commit", "committed", "closed"];

function nextLPStatus(current: LPStatus): LPStatus | null {
  const idx = LP_STATUS_SEQUENCE.indexOf(current);
  if (idx === -1 || idx >= LP_STATUS_SEQUENCE.length - 1) return null;
  return LP_STATUS_SEQUENCE[idx + 1];
}

// ─── Time advance engine ──────────────────────────────────────────────────────

function applyTimeAdvance(state: SimulationState, newDate: string): SimulationState {
  const newEvents: EventFeedItem[] = [];
  let repDelta = 0;

  const updatedTasks: Task[] = state.tasks.map((task) => {
    if (task.status === "open" && task.dueDate && isBefore(task.dueDate, newDate)) {
      newEvents.push(
        event(task.dueDate, "task_missed", `Missed deadline: ${task.title}`,
          `Task due ${task.dueDate} was not completed before time advanced to ${newDate}.`, "negative")
      );
      repDelta -= task.priority === "high" ? 4 : task.priority === "medium" ? 2 : 1;
      return { ...task, status: "missed" };
    }
    return task;
  });

  if (repDelta < 0) {
    newEvents.push(
      event(newDate, "reputation_change",
        `Reputation −${Math.abs(repDelta)} pts`,
        `${Math.abs(repDelta)} reputation points lost — missed deadlines signal poor execution to LPs and bankers.`,
        "negative")
    );
  }

  newEvents.push(
    event(newDate, "time_advance",
      `Simulation advanced to ${newDate}`,
      `Time moved from ${state.currentDate} to ${newDate}.`,
      "neutral")
  );

  return {
    ...state,
    currentDate: newDate,
    tasks: updatedTasks,
    reputationScore: Math.max(0, Math.min(100, state.reputationScore + repDelta)),
    eventFeed: [...newEvents, ...state.eventFeed],
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function simulationReducer(state: SimulationState, action: Action): SimulationState {
  switch (action.type) {

    case "ADVANCE_DAYS":
      return applyTimeAdvance(state, addDays(state.currentDate, action.payload));

    case "ADVANCE_TO_DATE":
      return applyTimeAdvance(state, action.payload);

    case "COMPLETE_TASK": {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (!task || task.status !== "open") return state;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload ? { ...t, status: "completed" } : t
        ),
        modelingSkillScore:
          task.category === "modeling"
            ? Math.min(100, state.modelingSkillScore + 3)
            : state.modelingSkillScore,
        reputationScore: Math.min(100, state.reputationScore + 1),
        eventFeed: [
          event(state.currentDate, "task_completed", `Completed: ${task.title}`, task.description, "positive"),
          ...state.eventFeed,
        ],
      };
    }

    case "ADVANCE_DEAL_STAGE": {
      const deal = state.deals.find((d) => d.id === action.payload.dealId);
      if (!deal) return state;
      const next = nextStage(deal.stage);
      if (!next) return state;

      const autoTask = stageTask(deal.id, deal.companyName, next, state.currentDate);
      const newTasks = autoTask ? [...state.tasks, autoTask] : state.tasks;

      const stageEventTitle = `${deal.companyName} → ${STAGE_LABELS[next]}`;
      const stageEventDesc = autoTask
        ? `Deal advanced from ${STAGE_LABELS[deal.stage]}. New task created: "${autoTask.title}" due in ${autoTask.dueDate}.`
        : `Deal advanced from ${STAGE_LABELS[deal.stage]} to ${STAGE_LABELS[next]}.`;

      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === deal.id ? { ...d, stage: next } : d
        ),
        tasks: newTasks,
        reputationScore: Math.min(100, state.reputationScore + 2),
        eventFeed: [
          event(state.currentDate, "deal_update", stageEventTitle, stageEventDesc, "positive"),
          ...state.eventFeed,
        ],
      };
    }

    case "PASS_DEAL": {
      const deal = state.deals.find((d) => d.id === action.payload.dealId);
      if (!deal) return state;
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === deal.id ? { ...d, stage: "passed", notes: `${d.notes}\n[Passed: ${action.payload.reason}]` } : d
        ),
        eventFeed: [
          event(state.currentDate, "deal_update",
            `Passed on ${deal.companyName}`,
            action.payload.reason || "Deal did not meet investment criteria.",
            "neutral"),
          ...state.eventFeed,
        ],
      };
    }

    case "ADVANCE_LP_STATUS": {
      const lp = state.lps.find((l) => l.id === action.payload.lpId);
      if (!lp) return state;
      const next = nextLPStatus(lp.status);
      if (!next) return state;

      const isCommitting = next === "committed";
      const newCommittedAmount = isCommitting ? lp.targetCommitment : lp.committedAmount;
      const capitalIncrease = isCommitting ? lp.targetCommitment - lp.committedAmount : 0;

      const statusLabels: Record<LPStatus, string> = {
        prospect: "Prospect",
        soft_commit: "Soft Commit",
        committed: "Committed",
        closed: "Closed",
      };

      return {
        ...state,
        lps: state.lps.map((l) =>
          l.id === lp.id
            ? { ...l, status: next, committedAmount: newCommittedAmount, lastContactDate: state.currentDate }
            : l
        ),
        fund: isCommitting
          ? { ...state.fund, committedCapital: state.fund.committedCapital + capitalIncrease }
          : state.fund,
        reputationScore: isCommitting ? Math.min(100, state.reputationScore + 3) : state.reputationScore,
        eventFeed: [
          event(state.currentDate, "lp_update",
            `${lp.name} → ${statusLabels[next]}`,
            isCommitting
              ? `${lp.name} committed $${lp.targetCommitment}M. Fund committed capital now $${state.fund.committedCapital + capitalIncrease}M.`
              : `${lp.name} status advanced from ${statusLabels[lp.status]} to ${statusLabels[next]}.`,
            isCommitting ? "positive" : "neutral"),
          ...state.eventFeed,
        ],
      };
    }

    case "LOG_LP_CONTACT": {
      const lp = state.lps.find((l) => l.id === action.payload.lpId);
      if (!lp) return state;
      return {
        ...state,
        lps: state.lps.map((l) =>
          l.id === lp.id
            ? { ...l, lastContactDate: state.currentDate, notes: action.payload.note ? `${l.notes}\n[${state.currentDate}] ${action.payload.note}` : l.notes }
            : l
        ),
        eventFeed: [
          event(state.currentDate, "lp_update",
            `Contact logged — ${lp.name}`,
            action.payload.note || `Follow-up call/meeting with ${lp.contactName}.`,
            "neutral"),
          ...state.eventFeed,
        ],
      };
    }

    case "LOG_BANKER_CONTACT": {
      const banker = state.bankers.find((b) => b.id === action.payload.bankerId);
      if (!banker) return state;
      return {
        ...state,
        bankers: state.bankers.map((b) =>
          b.id === banker.id
            ? { ...b, lastInteraction: state.currentDate, relationship: b.relationship === "cold" ? "warm" : b.relationship }
            : b
        ),
        eventFeed: [
          event(state.currentDate, "lp_update",
            `Banker outreach — ${banker.name} (${banker.firm})`,
            `Logged interaction with ${banker.name}. Relationship maintained.`,
            "positive"),
          ...state.eventFeed,
        ],
      };
    }

    case "ADD_TASK": {
      const newTask: Task = {
        ...action.payload,
        id: `task-${uid()}`,
        status: "open",
      };
      return {
        ...state,
        tasks: [...state.tasks, newTask],
      };
    }

    case "ADD_EVENT":
      return { ...state, eventFeed: [action.payload, ...state.eventFeed] };

    case "HYDRATE":
      return action.payload;

    case "RESET":
      return INITIAL_STATE;

    default:
      return state;
  }
}

// ─── localStorage persistence ─────────────────────────────────────────────────

const STORAGE_KEY = "pe-sim-state-v3"; // bump to pick up new sample deadline tasks

function loadState(): SimulationState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    return JSON.parse(raw) as SimulationState;
  } catch {
    return INITIAL_STATE;
  }
}

function saveState(state: SimulationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

// ─── userId helper ────────────────────────────────────────────────────────────

function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "ssr-placeholder";
  const key = "pe-sim-user-id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const newId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(key, newId);
  return newId;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface SimulationContextValue {
  state: SimulationState;
  notifications: Notification[];
  dbStatus: DbStatus;
  dismissNotification: (id: string) => void;
  // Time controls
  advanceDays: (days: number) => void;
  advanceToDate: (date: string) => void;
  advanceToNextDeadline: () => void;
  advanceToNextMajorEvent: () => void;
  // Task actions
  completeTask: (taskId: string) => void;
  addTask: (task: Omit<Task, "id" | "status">) => void;
  // Deal actions
  advanceDealStage: (dealId: string) => void;
  passDeal: (dealId: string, reason: string) => void;
  // LP actions
  advanceLPStatus: (lpId: string) => void;
  logLPContact: (lpId: string, note?: string) => void;
  // Banker actions
  logBankerContact: (bankerId: string) => void;
  // Meta
  resetSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(simulationReducer, undefined, loadState);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatus>(supabase ? "loading" : "unconfigured");
  const userIdRef = useRef<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: try to load state from Supabase; fall back to localStorage (already loaded)
  useEffect(() => {
    if (!supabase) return;
    const userId = getOrCreateUserId();
    userIdRef.current = userId;
    setDbStatus("loading");
    loadStateFromSupabase(userId).then((loaded) => {
      if (loaded) {
        dispatch({ type: "HYDRATE", payload: loaded });
        setDbStatus("synced");
      } else {
        // No Supabase record yet — seed it from current localStorage state
        setDbStatus("saving");
        saveStateToSupabase(userId, state)
          .then(() => setDbStatus("synced"))
          .catch(() => setDbStatus("error"));
      }
    }).catch(() => setDbStatus("error"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage immediately, Supabase with 1.5 s debounce
  useEffect(() => {
    saveState(state);

    if (!supabase) return;
    if (!userIdRef.current) {
      userIdRef.current = getOrCreateUserId();
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setDbStatus("saving");
      saveStateToSupabase(userIdRef.current, state)
        .then(() => setDbStatus("synced"))
        .catch(() => setDbStatus("error"));
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state]);

  function notify(type: Notification["type"], message: string) {
    const id = `notif-${uid()}`;
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const advanceDays = useCallback((days: number) => {
    dispatch({ type: "ADVANCE_DAYS", payload: days });
    notify("info", `Advanced ${days} day${days !== 1 ? "s" : ""}`);
  }, []);

  const advanceToDate = useCallback((date: string) => {
    dispatch({ type: "ADVANCE_TO_DATE", payload: date });
  }, []);

  const advanceToNextDeadline = useCallback(() => {
    const upcoming = state.tasks
      .filter((t) => t.status === "open" && t.dueDate > state.currentDate)
      .map((t) => t.dueDate);
    const dealDeadlines = state.deals
      .filter((d) => d.processDeadline && d.processDeadline > state.currentDate)
      .map((d) => d.processDeadline!);
    const all = [...upcoming, ...dealDeadlines].sort();
    const target = all[0];
    if (target) {
      dispatch({ type: "ADVANCE_TO_DATE", payload: target });
      notify("info", `Advanced to next deadline: ${target}`);
    } else {
      dispatch({ type: "ADVANCE_DAYS", payload: 7 });
      notify("info", "No upcoming deadlines — advanced 7 days");
    }
  }, [state.tasks, state.deals, state.currentDate]);

  const advanceToNextMajorEvent = useCallback(() => {
    const highTasks = state.tasks
      .filter((t) => t.status === "open" && t.priority === "high" && t.dueDate > state.currentDate)
      .map((t) => t.dueDate);
    const dealDeadlines = state.deals
      .filter((d) => d.processDeadline && d.processDeadline > state.currentDate)
      .map((d) => d.processDeadline!);
    const all = [...highTasks, ...dealDeadlines].sort();
    const target = all[0];
    if (target) {
      dispatch({ type: "ADVANCE_TO_DATE", payload: target });
      notify("info", `Advanced to major event: ${target}`);
    } else {
      dispatch({ type: "ADVANCE_DAYS", payload: 14 });
      notify("info", "No major events — advanced 14 days");
    }
  }, [state.tasks, state.deals, state.currentDate]);

  const completeTask = useCallback((taskId: string) => {
    const task = state.tasks.find((t) => t.id === taskId);
    dispatch({ type: "COMPLETE_TASK", payload: taskId });
    if (task) notify("success", `Task completed: ${task.title}`);
  }, [state.tasks]);

  const addTask = useCallback((task: Omit<Task, "id" | "status">) => {
    dispatch({ type: "ADD_TASK", payload: task });
    notify("success", `New task added: ${task.title}`);
  }, []);

  const advanceDealStage = useCallback((dealId: string) => {
    const deal = state.deals.find((d) => d.id === dealId);
    if (!deal) return;
    const next = nextStage(deal.stage);
    if (!next) return;
    dispatch({ type: "ADVANCE_DEAL_STAGE", payload: { dealId } });
    notify("success", `${deal.companyName} advanced to ${STAGE_LABELS[next]}`);
  }, [state.deals]);

  const passDeal = useCallback((dealId: string, reason: string) => {
    const deal = state.deals.find((d) => d.id === dealId);
    dispatch({ type: "PASS_DEAL", payload: { dealId, reason } });
    if (deal) notify("info", `Passed on ${deal.companyName}`);
  }, [state.deals]);

  const advanceLPStatus = useCallback((lpId: string) => {
    const lp = state.lps.find((l) => l.id === lpId);
    if (!lp) return;
    const next = nextLPStatus(lp.status);
    if (!next) return;
    dispatch({ type: "ADVANCE_LP_STATUS", payload: { lpId } });
    const labels: Record<LPStatus, string> = { prospect: "Prospect", soft_commit: "Soft Commit", committed: "Committed", closed: "Closed" };
    notify(next === "committed" ? "success" : "info", `${lp.name} → ${labels[next]}`);
  }, [state.lps]);

  const logLPContact = useCallback((lpId: string, note = "") => {
    const lp = state.lps.find((l) => l.id === lpId);
    dispatch({ type: "LOG_LP_CONTACT", payload: { lpId, note } });
    if (lp) notify("info", `Contact logged: ${lp.name}`);
  }, [state.lps]);

  const logBankerContact = useCallback((bankerId: string) => {
    const banker = state.bankers.find((b) => b.id === bankerId);
    dispatch({ type: "LOG_BANKER_CONTACT", payload: { bankerId } });
    if (banker) notify("info", `Outreach logged: ${banker.name} (${banker.firm})`);
  }, [state.bankers]);

  const resetSimulation = useCallback(() => {
    dispatch({ type: "RESET" });
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    notify("warning", "Simulation reset to initial state");
  }, []);

  return (
    <SimulationContext.Provider value={{
      state, notifications, dbStatus, dismissNotification,
      advanceDays, advanceToDate, advanceToNextDeadline, advanceToNextMajorEvent,
      completeTask, addTask,
      advanceDealStage, passDeal,
      advanceLPStatus, logLPContact,
      logBankerContact,
      resetSimulation,
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation(): SimulationContextValue {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used inside SimulationProvider");
  return ctx;
}

// Re-export so pipeline/fundraising pages don't need to import separately
export { nextStage, STAGE_LABELS, nextLPStatus };
