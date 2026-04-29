"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { useSimulation } from "@/store/simulationStore";
import type { Notification } from "@/store/simulationStore";

const ICONS: Record<Notification["type"], string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

const STYLES: Record<Notification["type"], string> = {
  success: "border-emerald-700 bg-emerald-950/90 text-emerald-300",
  error: "border-red-700 bg-red-950/90 text-red-300",
  warning: "border-amber-700 bg-amber-950/90 text-amber-300",
  info: "border-blue-800 bg-blue-950/90 text-blue-300",
};

const ICON_STYLES: Record<Notification["type"], string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  warning: "text-amber-400",
  info: "text-blue-400",
};

function ToastItem({ notif, onDismiss }: { notif: Notification; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={clsx(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs shadow-xl backdrop-blur transition-all duration-300",
        STYLES[notif.type],
        visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
      )}
    >
      <span className={clsx("mt-0.5 flex-shrink-0 font-bold", ICON_STYLES[notif.type])}>
        {ICONS[notif.type]}
      </span>
      <span className="flex-1 leading-relaxed">{notif.message}</span>
      <button
        onClick={onDismiss}
        className="ml-1 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity text-[11px]"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { notifications, dismissNotification } = useSimulation();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80 pointer-events-none">
      {notifications.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <ToastItem notif={n} onDismiss={() => dismissNotification(n.id)} />
        </div>
      ))}
    </div>
  );
}
