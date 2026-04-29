"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";
import type { SimulationState, Task, EventFeedItem } from "@/lib/types";
import { INITIAL_STATE } from "@/lib/seedData";
import { addDays, isBefore } from "@/lib/dateUtils";

type Action =
  | { type: "ADVANCE_DAYS"; payload: number }
  | { type: "ADVANCE_TO_DATE"; payload: string }
  | { type: "COMPLETE_TASK"; payload: string }
  | { type: "ADD_EVENT"; payload: EventFeedItem };

function generateId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function applyTimeAdvance(state: SimulationState, newDate: string): SimulationState {
  const newEvents: EventFeedItem[] = [];
  let repDelta = 0;

  // Mark tasks as missed if due date passed and they were open
  const updatedTasks: Task[] = state.tasks.map((task) => {
    if (
      task.status === "open" &&
      task.dueDate &&
      isBefore(task.dueDate, newDate)
    ) {
      newEvents.push({
        id: generateId(),
        date: task.dueDate,
        type: "task_missed",
        title: `Missed deadline: ${task.title}`,
        description: `Task was not completed by ${task.dueDate}. Deadline passed during time advance.`,
        impact: "negative",
      });
      repDelta -= task.priority === "high" ? 4 : task.priority === "medium" ? 2 : 1;
      return { ...task, status: "missed" };
    }
    return task;
  });

  // Add reputation consequence event if reputation dropped
  if (repDelta < 0) {
    newEvents.push({
      id: generateId(),
      date: newDate,
      type: "reputation_change",
      title: `Reputation decreased by ${Math.abs(repDelta)} points`,
      description: `Missed deadlines have damaged your fund's reputation. LPs and bankers expect follow-through.`,
      impact: "negative",
    });
  }

  // Add time advance event
  newEvents.push({
    id: generateId(),
    date: newDate,
    type: "time_advance",
    title: `Simulation advanced to ${newDate}`,
    description: `Time advanced from ${state.currentDate} to ${newDate}.`,
    impact: "neutral",
  });

  const newScore = Math.max(0, Math.min(100, state.reputationScore + repDelta));

  return {
    ...state,
    currentDate: newDate,
    tasks: updatedTasks,
    reputationScore: newScore,
    eventFeed: [...newEvents, ...state.eventFeed],
  };
}

function simulationReducer(state: SimulationState, action: Action): SimulationState {
  switch (action.type) {
    case "ADVANCE_DAYS": {
      const newDate = addDays(state.currentDate, action.payload);
      return applyTimeAdvance(state, newDate);
    }
    case "ADVANCE_TO_DATE": {
      return applyTimeAdvance(state, action.payload);
    }
    case "COMPLETE_TASK": {
      const updatedTasks = state.tasks.map((t) =>
        t.id === action.payload ? { ...t, status: "completed" as const } : t
      );
      const task = state.tasks.find((t) => t.id === action.payload);
      const newEvent: EventFeedItem = {
        id: generateId(),
        date: state.currentDate,
        type: "task_completed",
        title: `Completed: ${task?.title ?? "Task"}`,
        description: task?.description ?? "",
        impact: "positive",
      };
      return {
        ...state,
        tasks: updatedTasks,
        eventFeed: [newEvent, ...state.eventFeed],
        modelingSkillScore: task?.category === "modeling"
          ? Math.min(100, state.modelingSkillScore + 3)
          : state.modelingSkillScore,
      };
    }
    case "ADD_EVENT": {
      return { ...state, eventFeed: [action.payload, ...state.eventFeed] };
    }
    default:
      return state;
  }
}

interface SimulationContextValue {
  state: SimulationState;
  advanceDays: (days: number) => void;
  advanceToDate: (date: string) => void;
  advanceToNextDeadline: () => void;
  advanceToNextMajorEvent: () => void;
  completeTask: (taskId: string) => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(simulationReducer, INITIAL_STATE);

  const advanceDays = useCallback((days: number) => {
    dispatch({ type: "ADVANCE_DAYS", payload: days });
  }, []);

  const advanceToDate = useCallback((date: string) => {
    dispatch({ type: "ADVANCE_TO_DATE", payload: date });
  }, []);

  const advanceToNextDeadline = useCallback(() => {
    const upcoming = state.tasks
      .filter((t) => t.status === "open" && t.dueDate && t.dueDate > state.currentDate)
      .map((t) => t.dueDate)
      .sort();

    const dealDeadlines = state.deals
      .filter((d) => d.processDeadline && d.processDeadline > state.currentDate)
      .map((d) => d.processDeadline!)
      .sort();

    const all = [...upcoming, ...dealDeadlines].sort();
    if (all.length > 0) {
      dispatch({ type: "ADVANCE_TO_DATE", payload: all[0] });
    } else {
      dispatch({ type: "ADVANCE_DAYS", payload: 7 });
    }
  }, [state.tasks, state.deals, state.currentDate]);

  const advanceToNextMajorEvent = useCallback(() => {
    // Major events: deal process deadlines, LP IC meetings (flagged in notes), task due dates for high-priority
    const highPriorityTaskDates = state.tasks
      .filter((t) => t.status === "open" && t.priority === "high" && t.dueDate > state.currentDate)
      .map((t) => t.dueDate)
      .sort();

    const dealDeadlines = state.deals
      .filter((d) => d.processDeadline && d.processDeadline > state.currentDate)
      .map((d) => d.processDeadline!)
      .sort();

    const all = [...highPriorityTaskDates, ...dealDeadlines].sort();
    if (all.length > 0) {
      dispatch({ type: "ADVANCE_TO_DATE", payload: all[0] });
    } else {
      dispatch({ type: "ADVANCE_DAYS", payload: 14 });
    }
  }, [state.tasks, state.deals, state.currentDate]);

  const completeTask = useCallback((taskId: string) => {
    dispatch({ type: "COMPLETE_TASK", payload: taskId });
  }, []);

  return (
    <SimulationContext.Provider
      value={{ state, advanceDays, advanceToDate, advanceToNextDeadline, advanceToNextMajorEvent, completeTask }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation(): SimulationContextValue {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used inside SimulationProvider");
  return ctx;
}
