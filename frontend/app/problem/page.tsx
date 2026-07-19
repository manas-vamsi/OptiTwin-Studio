"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import type { ProblemSpec } from "@/lib/types";
import { loadSpec, saveSpec, parseSpec, parseJobsCsv, specSummary } from "@/lib/problem";

const DEFAULT_TEXT =
  "We operate 20 CNC machines running 250 production jobs for customers with different priority tiers. Each machine has scheduled maintenance windows and a maximum of 16 working hours per day. Electricity is more expensive during peak hours (12pm–6pm). We want to minimize total production time and electricity consumption while still hitting every delivery deadline.";

const CON_CHIPS = ["Maintenance windows", "≤16 h/day", "Peak-hour energy cap", "Delivery deadlines", "Priority orders first"];
const OBJ_CHIPS = [{ t: "Minimize production time", w: "70%" }, { t: "Minimize energy use", w: "55%" }];

type Chip = { t: string; w: string };

export default function Problem() {
  const box = useRef<HTMLTextAreaElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [spec, setSpec] = useState<ProblemSpec | null>(null);
  const [done, setDone] = useState(false);
  const [csvName, setCsvName] = useState("");

  function apply(next: ProblemSpec | null) {
    setSpec(next);
    saveSpec(next);
  }

  function extract() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setDone(true);
      const parsed = parseSpec(box.current?.value ?? "");
      // keep an uploaded CSV's jobs unless the text also names a job count
      const jobs = spec?.jobs && !parsed?.nJobs ? { jobs: spec.jobs } : {};
      apply(parsed || spec ? { ...parsed, ...jobs } : null);
    }, 1200);
  }

  async function onCsv(file: File | undefined) {
    if (!file) return;
    const jobs = parseJobsCsv(await file.text());
    if (!jobs) return;
    setCsvName(`${file.name} · ${jobs.length} jobs`);
    setDone(true);
    apply({ ...(spec ?? parseSpec(box.current?.value ?? "") ?? {}), jobs, nJobs: undefined });
  }

  const s = specSummary(spec ?? loadSpec());
  const resChips: Chip[] = [
    { t: `${s.machines} machines`, w: "" },
    { t: spec?.jobs ? `${s.jobs} jobs (CSV)` : `${s.jobs} jobs`, w: "" },
    { t: "3 shifts", w: "" }, { t: "Operators", w: "" }, { t: "Customer tiers", w: "" },
  ];

  const setCount = (key: "nMachines" | "nJobs", v: number, cap: number) => {
    const n = Math.max(1, Math.min(cap, Math.round(v || 1)));
    apply({ ...(spec ?? {}), [key]: n, ...(key === "nJobs" ? { jobs: undefined } : {}) });
    if (key === "nJobs") setCsvName("");
  };

  const card = (cls: string, title: string, icon: React.ReactNode, chips: Chip[]) => (
    <div className="card glass card-pad ex-card show">
      <div className="eh"><div className={"ei " + cls}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>{icon}</svg></div><h4>{title}</h4><span className="cnt">{chips.length} found</span></div>
      <div className="chips">
        {chips.map((c, i) => (
          <span className="chip" key={c.t} style={{ animationDelay: `${i * 0.05}s` }}>
            {c.w && <span className="wt">{c.w}</span>}{c.t}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="page-head stagger">
        <div>
          <div className="page-title">Define your <span className="serif">problem</span></div>
          <div className="page-sub">Describe your operation in plain language. The extracted instance is what the solvers actually run.</div>
        </div>
        <div className="head-actions"><div className="seg"><button className="on">Describe</button><button>Templates</button></div></div>
      </div>

      <div className="card glass card-pad stagger" style={{ padding: 24 }}>
        <div className={"prompt-shell" + (scanning ? " scanning" : "")}>
          <div className="scanline" />
          <textarea ref={box} className="prompt-box" defaultValue={DEFAULT_TEXT} />
        </div>
        <div className="prompt-toolbar">
          <input ref={csvInput} type="file" accept=".csv,text/csv" style={{ display: "none" }}
            onChange={(e) => onCsv(e.target.files?.[0])} />
          <button className="up-chip" onClick={() => csvInput.current?.click()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M14 3v5h5" /><path d="M8 13h5M8 17h8" /><path d="M6 3h9l4 4v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" /></svg>
            {csvName || "CSV (dur,tier,deadline)"}
          </button>
          <button className="btn primary" onClick={extract} style={{ marginLeft: "auto" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={scanning ? "spin" : ""}><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" /></svg>
            <span>{scanning ? "Extracting…" : done ? "Re-extract" : "Extract"}</span>
          </button>
        </div>
      </div>

      {!done && (
        <div className="page-sub stagger" style={{ marginTop: 22, textAlign: "center", color: "var(--text-ghost)" }}>
          Counts like “3 machines” or “40 trays” are detected from your text — or upload a jobs CSV. The result drives Optimization &amp; Simulation.
        </div>
      )}

      {done && (
        <>
          <div className="card glass card-pad stagger" style={{ marginTop: 18, display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
            <b style={{ fontSize: 13 }}>Instance</b>
            <label style={{ fontSize: 12.5, color: "var(--text-dim)", display: "flex", gap: 8, alignItems: "center" }}>
              Machines
              <input type="number" min={1} max={25} value={s.machines}
                onChange={(e) => setCount("nMachines", +e.target.value, 25)}
                style={{ width: 70, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "inherit", padding: "6px 8px" }} />
            </label>
            <label style={{ fontSize: 12.5, color: "var(--text-dim)", display: "flex", gap: 8, alignItems: "center" }}>
              Jobs
              <input type="number" min={1} max={300} value={s.jobs} disabled={!!spec?.jobs}
                onChange={(e) => setCount("nJobs", +e.target.value, 300)}
                style={{ width: 70, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "inherit", padding: "6px 8px", opacity: spec?.jobs ? 0.5 : 1 }} />
            </label>
            <span className="tag draft" style={{ marginLeft: "auto" }}>
              {s.custom ? "Custom instance — used by Optimization & Simulation" : "Default 20×250 instance"}
            </span>
            {s.custom && <button className="link" style={{ background: "none", border: 0, cursor: "pointer" }} onClick={() => { apply(null); setCsvName(""); }}>Reset</button>}
          </div>

          <div className="extract-grid" style={{ display: "grid" }}>
            {card("res", "Resources", <><rect x="3" y="8" width="7" height="12" rx="1" /><rect x="14" y="4" width="7" height="16" rx="1" /></>, resChips)}
            {card("con", "Constraints", <><path d="M12 3l9 16H3L12 3z" /><path d="M12 10v4M12 17h.01" /></>, CON_CHIPS.map((t) => ({ t, w: "" })))}
            {card("obj", "Objectives", <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>, OBJ_CHIPS)}
          </div>
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <Link className="btn primary" href="/optimization" style={{ padding: "12px 22px" }}>
              Run Optimization on this instance
              <svg viewBox="0 0 24 24" width="18" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
            </Link>
          </div>
        </>
      )}
    </>
  );
}
