"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { ToastContainer } from "@/components/ui/Toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      <ToastContainer />
    </div>
  );
}
