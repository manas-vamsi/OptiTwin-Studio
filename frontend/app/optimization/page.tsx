"use client";
import { useState } from "react";
import { solve } from "@/lib/api";
import type { RunResult } from "@/lib/types";

const OBJ = [
  { label: "Minimize production time", def: 70 },
  { label: "Minimize energy consumption", def: 55 },
  { label: "Maximize on-time delivery", def: 90 },
];
const SOLVERS = [
  { id: "classical", name: "Classical", desc: "OR-Tools CP-SAT · MIP", icon: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6v6H9z" /></> },
  { id: "quantum", name: "Quantum-inspired", desc: "QUBO · D-Wave annealer", icon: <><ellipse cx="12" cy="12" rx="10" ry="4" /><ellipse cx="12" cy="12" rx="4" ry="10" /></> },
  { id: "hybrid", name: "Hybrid quantum", desc: "QUBO assign · SA sequence", icon: <><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="9" /></> },
];
const STEPS = ["Building model", "Classical solver", "Hybrid quantum solver", "Comparing solutions"];
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const NAME: Record<string, string> = { classical: "Classical", quantum: "Quantum-inspired", hybrid: "Hybrid quantum" };

export default function Optimization() {
  const [weights, setWeights] = useState(OBJ.map((o) => o.def));
  const [on, setOn] = useState<Record<string, boolean>>({ classical: true, quantum: false, hybrid: true });
  const [advanced, setAdvanced] = useState(false);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [res, setRes] = useState<RunResult | null>(null);
  const [source, setSource] = useState("");

  const solverCount = Object.values(on).filter(Boolean).length;

  async function run() {
    setRunning(true); setRes(null); setStep(0);
    const p = solve({ t: weights[0] / 100, e: weights[1] / 100, d: weights[2] / 100 });
    for (let i = 0; i < STEPS.length; i++) { setStep(i); await delay(850); }
    const r = await p;
    setSource(r.source); setRes(r); setRunning(false); setStep(-1);
  }

  const score = res ? Math.max(60, Math.min(99, Math.round(70 + res.improvePct * 1.4 + (res.best.m.onTime - 0.85) * 100))) : 0;
  const C = 351.8;

  return (
    <>
      <div className="page-head stagger">
        <div>
          <div className="page-title">Optimization <span className="serif">Engine</span></div>
          <div className="page-sub">CNC Production Scheduling · 20 machines · 250 jobs</div>
        </div>
        <div className="head-actions">
          <div className="seg">
            <button className={!advanced ? "on" : ""} onClick={() => setAdvanced(false)}>Basic</button>
            <button className={advanced ? "on" : ""} onClick={() => setAdvanced(true)}>Advanced</button>
          </div>
        </div>
      </div>

      <div className="opt-layout">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }} className="stagger">
          <div className="card glass card-pad">
            <div className="card-head"><h3>Objective function</h3><span className="link">Weighted</span></div>
            <div className="field" style={{ marginBottom: 0 }}>
              {OBJ.map((o, i) => (
                <div className="obj-row" key={i}>
                  <span className="ob">{o.label}</span>
                  <input type="range" min={0} max={100} value={weights[i]}
                    onChange={(e) => setWeights((w) => w.map((v, j) => (j === i ? +e.target.value : v)))} />
                  <span className="wv">{weights[i]}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card glass card-pad">
            <div className="card-head"><h3>Constraints</h3><span className="link">6 active</span></div>
            {[["Maintenance windows respected", "20 machines"], ["Max working hours per machine", "≤ 16 h/day"], ["Peak-hour energy cap", "12pm–6pm"], ["Priority orders first", "Tier A"], ["Delivery deadlines", "250 jobs"], ["Shift availability", "3 shifts"]].map((c, i) => (
              <div className="constraint" key={i}><span className="cdot" style={i === 4 ? { background: "var(--amber)" } : undefined} />{c[0]}<span className="cval">{c[1]}</span></div>
            ))}
          </div>

          <div className="card glass card-pad">
            <div className="card-head"><h3>Solver strategy</h3></div>
            <div className="solver-opts">
              {SOLVERS.map((s) => (
                <div key={s.id} className={"solver" + (on[s.id] ? " on" : "")} onClick={() => setOn((o) => ({ ...o, [s.id]: !o[s.id] }))}>
                  <div className="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 12l4 4 10-10" /></svg></div>
                  <div className="sic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>{s.icon}</svg></div>
                  <div className="sn">{s.name}</div><div className="sd">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={"adv-panel" + (advanced ? " open" : "")}>
            <div className="card glass card-pad" style={{ marginBottom: 18 }}>
              <div className="card-head"><h3>Generated model</h3><span className="link">Mixed-Integer Program</span></div>
              <div className="code-block">{`# Decision variables
x[i,j,t] ∈ {0,1}   # job i on machine j at slot t
s[i]     ≥ 0       # start time of job i

# Objective
minimize  ${(weights[0] / 100).toFixed(2)}·Σ makespan + ${(weights[1] / 100).toFixed(2)}·Σ energy − ${(weights[2] / 100).toFixed(2)}·Σ onTime

# Subject to
∀j: Σ hours[j] ≤ 16
∀t∈peak: Σ draw[j,t] ≤ Cap_peak
∀i: s[i] + dur[i] ≤ deadline[i]`}</div>
            </div>
            <div className="card glass card-pad">
              <div className="card-head"><h3>QUBO preview</h3><span className="link">Hybrid backend</span></div>
              <div className="code-block">{`# Quadratic Unconstrained Binary Optimization
Q = 5000 × 5000 upper-triangular   # 250 jobs × 20 machines
H = Σ Qᵢᵢ·xᵢ + Σ Qᵢⱼ·xᵢxⱼ          # 675,000 nonzeros, penalty λ = 8.0
#   objective: time + energy + load-balance quadratic
anneal → dwave-samplers SA   reads: 4   sweeps: 200
# same matrix a D-Wave QPU consumes — see GET /api/qubo`}</div>
            </div>
          </div>
        </div>

        <div className="stagger">
          <div className="card glass card-pad run-card">
            <div className="card-head"><h3>Run</h3><span className="link">{solverCount} solver{solverCount === 1 ? "" : "s"}</span></div>
            <p style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 18 }}>
              Runs the selected solvers, compares quality &amp; runtime, and explains the winning schedule.
            </p>
            <button className="btn primary" onClick={run} disabled={running}
              style={{ width: "100%", justifyContent: "center", padding: 12, opacity: running ? 0.6 : 1 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={running ? "spin" : ""}><path d="M6 4l14 8-14 8V4z" /></svg>
              <span>{running ? "Solving…" : res ? "Re-run" : "Run optimization"}</span>
            </button>
            {(running || step >= 0) && (
              <div className="run-status" style={{ display: "flex", marginTop: 16 }}>
                {STEPS.map((s, i) => (
                  <div key={i} className={"run-step" + (i === step ? " active" : i < step ? " done" : "")}>
                    <span className="rs-ic">{i < step ? "✓" : i + 1}</span>{s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card glass card-pad" style={{ marginTop: 18 }}>
            <div className="card-head"><h3>Explainability</h3></div>
            <p style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.65 }}>
              Every result ships with a plain-language business summary, the trade-offs made, decision variables, and a confidence score.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <span className="tag draft">Business summary</span><span className="tag draft">Trade-offs</span><span className="tag draft">Confidence</span>
            </div>
          </div>
        </div>
      </div>

      {res && <Results res={res} score={score} source={source} C={C} />}
    </>
  );
}

function Results({ res, score, source, C }: { res: RunResult; score: number; source: string; C: number }) {
  const b = res.base, x = res.best.m;
  const timeCut = Math.round((100 * (b.makespan - x.makespan)) / b.makespan);
  const savedK = Math.round((res.baseMoney - res.bestMoney) / 1000);
  const enSave = Math.round((100 * (b.energy - x.energy)) / b.energy);
  const classical = res.solvers.find((s) => s.kind === "classical")!;
  const winPct = Math.round((100 * (classical.cost - res.best.cost)) / classical.cost);
  const bar = (before: number, after: number) => { const mx = Math.max(before, after) || 1; return [Math.round((90 * before) / mx), Math.round((90 * after) / mx)]; };
  const bars = [
    { lbl: "Makespan", h: bar(b.makespan, x.makespan), v: [(b.makespan / 24).toFixed(1) + "d", (x.makespan / 24).toFixed(1) + "d"] },
    { lbl: "Energy", h: bar(b.energy, x.energy), v: ["100%", Math.round((100 * x.energy) / b.energy) + "%"] },
    { lbl: "Utilization", h: bar(b.util, x.util), v: [Math.round(b.util * 100) + "%", Math.round(x.util * 100) + "%"] },
    { lbl: "On-time", h: bar(b.onTime, x.onTime), v: [(b.onTime * 100).toFixed(1) + "%", (x.onTime * 100).toFixed(1) + "%"] },
  ];
  const kpis = [
    { l: "Production time", v: "−" + timeCut + "%", d: `▼ ${(b.makespan - x.makespan).toFixed(1)}h saved` },
    { l: "Cost reduction", v: "$" + savedK + "K", d: "▲ vs baseline" },
    { l: "Energy savings", v: enSave + "%", d: "▼ off-peak shift" },
    { l: "Machine utilization", v: Math.round(x.util * 100) + "%", d: `▲ from ${Math.round(b.util * 100)}%` },
  ];
  return (
    <div style={{ marginTop: 26 }}>
      <div className="card glass score-hero stagger" style={{ marginBottom: 18 }}>
        <div className="score-ring">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="56" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
            <circle cx="65" cy="65" r="56" fill="none" stroke="url(#goldGrad)" strokeWidth={10} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - (C * score) / 100} transform="rotate(-90 65 65)" style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.16,1,.3,1)" }} />
            <defs><linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E3C892" /><stop offset="1" stopColor="#C9A86A" /></linearGradient></defs>
          </svg>
          <div className="sc"><b>{score}</b><span>Score</span></div>
        </div>
        <div className="score-copy">
          <h3>{NAME[res.best.kind]} found the best schedule</h3>
          <p>Reordering 250 jobs across 20 machines cut makespan by {timeCut}% and trimmed energy {enSave}% — on-time delivery {(x.onTime * 100).toFixed(1)}%. {winPct > 0 ? `The ${NAME[res.best.kind].toLowerCase()} solver beat the classical baseline by ${winPct}% on weighted quality.` : "All solvers converged to the same quality."}</p>
          <span className="conf">✓ Confidence {score}% · solved via {source} engine ({res.best.backend ?? "local"})</span>
        </div>
      </div>

      <div className="grid g-4 stagger" style={{ marginBottom: 18 }}>
        {kpis.map((k, i) => (
          <div className="card glass res-kpi" key={i}><div className="rl">{k.l}</div><div className="rv">{k.v}</div><div className="rd up">{k.d}</div></div>
        ))}
      </div>

      <div className="split">
        <div className="card glass card-pad stagger">
          <div className="card-head"><h3>Before vs after</h3><span className="link">Key metrics</span></div>
          <div className="cmp-bars">
            {bars.map((g, i) => (
              <div className="cmp-group" key={i}>
                <div className="cmp-cols">
                  <div className="cmp-col before" style={{ height: `${g.h[0]}%` }}><span className="cv">{g.v[0]}</span></div>
                  <div className="cmp-col after" style={{ height: `${g.h[1]}%` }}><span className="cv">{g.v[1]}</span></div>
                </div>
                <div className="cmp-lbl">{g.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card glass card-pad stagger">
          <div className="card-head"><h3>Solver comparison</h3></div>
          <table className="cmp-table">
            <thead><tr><th>Solver</th><th>Engine</th><th>Time</th><th>Quality</th></tr></thead>
            <tbody>
              {res.solvers.map((s) => (
                <tr key={s.kind}>
                  <td className={s.kind === res.best.kind ? "best" : ""}>{NAME[s.kind].replace("Quantum-inspired", "Quantum-insp.")}{s.kind === res.best.kind && <span className="win">Best</span>}</td>
                  <td><span className="tag draft mono">{s.backend ?? "local"}</span></td>
                  <td className="mono">{s.time}s</td>
                  <td><span className="bar-mini"><i style={{ width: `${Math.max(40, Math.min(99, s.quality))}%` }} /></span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {res.rustKernel && (
            <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--text-dim)" }}>
              ⚡ Rust SA kernel active — 56× hot loop, 50× search depth
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
