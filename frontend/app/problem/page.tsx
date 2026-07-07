"use client";
import { useState } from "react";
import Link from "next/link";

const DEFAULT_TEXT =
  "We operate 20 CNC machines running 250 production jobs for customers with different priority tiers. Each machine has scheduled maintenance windows and a maximum of 16 working hours per day. Electricity is more expensive during peak hours (12pm–6pm). We want to minimize total production time and electricity consumption while still hitting every delivery deadline.";

const EXTRACT = {
  res: ["20 CNC machines", "250 production jobs", "3 shifts", "Operators", "Customer tiers", "Tooling sets"].map((t) => ({ t, w: "" })),
  con: ["Maintenance windows", "≤16 h/day", "Peak-hour energy cap", "Delivery deadlines", "Priority orders first"].map((t) => ({ t, w: "" })),
  obj: [{ t: "Minimize production time", w: "70%" }, { t: "Minimize energy use", w: "55%" }],
};
const UPLOADS = [
  { label: "CSV", icon: <><path d="M14 3v5h5" /><path d="M8 13h5M8 17h8" /><path d="M6 3h9l4 4v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" /></> },
  { label: "Excel", icon: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8l8 8M16 8l-8 8" /></> },
  { label: "JSON", icon: <path d="M8 3H6a2 2 0 00-2 2v14a2 2 0 002 2h2M16 3h2a2 2 0 012 2v14a2 2 0 01-2 2h-2" /> },
  { label: "Database", icon: <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></> },
];

type Chip = { t: string; w: string };

export default function Problem() {
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const [cols, setCols] = useState<{ res: Chip[]; con: Chip[]; obj: Chip[] }>({ res: [], con: [], obj: [] });

  function extract() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false); setDone(true);
      setCols({ res: [...EXTRACT.res], con: [...EXTRACT.con], obj: [...EXTRACT.obj] });
    }, 1500);
  }
  const remove = (key: keyof typeof cols, i: number) =>
    setCols((c) => ({ ...c, [key]: c[key].filter((_, j) => j !== i) }));

  const card = (key: keyof typeof cols, cls: string, title: string, icon: React.ReactNode, chips: Chip[]) => (
    <div className="card glass card-pad ex-card show">
      <div className="eh"><div className={"ei " + cls}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>{icon}</svg></div><h4>{title}</h4><span className="cnt">{chips.length} found</span></div>
      <div className="chips">
        {chips.map((c, i) => (
          <span className="chip" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
            {c.w && <span className="wt">{c.w}</span>}{c.t}
            <span className="x" onClick={() => remove(key, i)}>✕</span>
          </span>
        ))}
        <span className="chip add">+ Add</span>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-head stagger">
        <div>
          <div className="page-title">Define your <span className="serif">problem</span></div>
          <div className="page-sub">Describe your operation in plain language. AI extracts the resources, constraints and goals.</div>
        </div>
        <div className="head-actions"><div className="seg"><button className="on">Describe</button><button>Templates</button></div></div>
      </div>

      <div className="card glass card-pad stagger" style={{ padding: 24 }}>
        <div className={"prompt-shell" + (scanning ? " scanning" : "")}>
          <div className="scanline" />
          <textarea className="prompt-box" defaultValue={DEFAULT_TEXT} />
        </div>
        <div className="prompt-toolbar">
          {UPLOADS.map((u) => (
            <button className="up-chip" key={u.label}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>{u.icon}</svg>{u.label}</button>
          ))}
          <button className="btn primary" onClick={extract} style={{ marginLeft: "auto" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={scanning ? "spin" : ""}><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" /></svg>
            <span>{scanning ? "Extracting…" : done ? "Re-extract" : "Extract with AI"}</span>
          </button>
        </div>
      </div>

      {!done && (
        <div className="page-sub stagger" style={{ marginTop: 22, textAlign: "center", color: "var(--text-ghost)" }}>
          AI will read your description and structure it below — every field stays editable.
        </div>
      )}

      {done && (
        <>
          <div className="extract-grid" style={{ display: "grid" }}>
            {card("res", "res", "Resources", <><rect x="3" y="8" width="7" height="12" rx="1" /><rect x="14" y="4" width="7" height="16" rx="1" /></>, cols.res)}
            {card("con", "con", "Constraints", <><path d="M12 3l9 16H3L12 3z" /><path d="M12 10v4M12 17h.01" /></>, cols.con)}
            {card("obj", "obj", "Objectives", <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>, cols.obj)}
          </div>
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <Link className="btn primary" href="/twin" style={{ padding: "12px 22px" }}>
              Build Digital Twin
              <svg viewBox="0 0 24 24" width="18" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
            </Link>
          </div>
        </>
      )}
    </>
  );
}
