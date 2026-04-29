import type { Metadata } from "next";
import "./globals.css";
import { SimulationProvider } from "@/store/simulationStore";

export const metadata: Metadata = {
  title: "PE Fund Simulator — Arcadia Capital Partners",
  description: "Single-player private equity fund lifecycle simulator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-full bg-[#070c1a] text-slate-100 antialiased">
        <SimulationProvider>{children}</SimulationProvider>
      </body>
    </html>
  );
}
