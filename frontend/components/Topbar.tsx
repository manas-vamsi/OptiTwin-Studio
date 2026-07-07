"use client";
import { usePathname } from "next/navigation";

const CRUMB: Record<string, string> = {
  "/": "Dashboard", "/problem": "Problem", "/twin": "Digital Twin",
  "/optimization": "Optimization", "/simulation": "Simulation", "/reports": "Reports",
};

export default function Topbar() {
  const path = usePathname();
  return (
    <div className="topbar">
      <div className="crumb"><b>{CRUMB[path] ?? "Workspace"}</b></div>
      <div className="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
        Search or ask AI…
        <span className="kbd">⌘K</span>
      </div>
      <div className="icon-btn" title="AI Copilot">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" /><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" /></svg>
      </div>
      <div className="icon-btn" title="Notifications">
        <span className="dot" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}><path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8z" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>
      </div>
    </div>
  );
}
