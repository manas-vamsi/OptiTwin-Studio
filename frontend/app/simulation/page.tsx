"use client";
import { useEffect, useState } from "react";
import { solve } from "@/lib/api";
import { loadSpec } from "@/lib/problem";
import type { ProblemSpec, RunResult, Scenario } from "@/lib/types";

const SCENARIOS: { id: string; icon: string; name: string; desc: string; sc: Scenario }[] = [
  { id: "mfail", icon: "⚠️", name: "Machine failure", desc: "3 CNC machines go down", sc: { machinesOff: 3 } },
  { id: "demand", icon: "📈", name: "Demand +30%", desc: "Order volume spikes", sc: { durMult: 1.3 } },
  { id: "energy", icon: "⚡", name: "Energy price +40%", desc: "Peak tariff surge", sc: { energyMult: 1.4 } },
  { id: "absence", icon: "👷", name: "Worker absence", desc: "2 machines unstaffed", sc: { machinesOff: 2 } },
  { id: "supplier", icon: "🚛", name: "Supplier delay", desc: "Deadlines pulled 20% in", sc: { deadlineMult: 0.8 } },
  { id: "maint", icon: "🔧", name: "Equipment maintenance", desc: "Slower runs, 1 offline", sc: { durMult: 1.15, machinesOff: 1 } },
];
const W = { t: 0.7, e: 0.55, d: 0.9 };
const pct = (a: number, b: number) => Math.round((100 * (b - a)) / (a || 1));

export default function Simulation() {
  const [pick, setPick] = useState<(typeof SCENARIOS)[number] | null>(null);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ nom: RunResult; sim: RunResult; name: string } | null>(null);
  const [spec, setSpec] = useState<ProblemSpec | null>(null);
  useEffect(() => setSpec(loadSpec()), []);

  async function run() {
    if (!pick) return;
    setBusy(true);
    const [nom, sim] = await Promise.all([solve(W, undefined, spec), solve(W, pick.sc, spec)]);
    setOut({ nom, sim, name: pick.name });
    setBusy(false);
  }

  return (
    <>
      <div className="page-head stagger">
        <div>
          <div className="page-title">Scenario <span className="serif">Simulation</span></div>
          <div className="page-sub">Stress-test the optimized schedule. Pick a what-if — the engine re-solves and shows the real impact.</div>
        </div>
      </div>

      <div className="card glass card-pad stagger">
        <div className="card-head"><h3>Scenario library</h3><span className="link">{pick ? pick.name : "None selected"}</span></div>
        <div className="solver-opts">
          {SCENARIOS.map((s) => (
            <div key={s.id} className={"solver" + (pick?.id === s.id ? " on" : "")} onClick={() => setPick(s)}>
              <div className="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 12l4 4 10-10" /></svg></div>
              <div className="sic" style={{ fontSize: 16 }}>{s.icon}</div>
              <div className="sn">{s.name}</div><div className="sd">{s.desc}</div>
            </div>
          ))}
        </div>
        <button className="btn primary" onClick={run} disabled={!pick || busy}
          style={{ marginTop: 18, justifyContent: "center", width: "100%", padding: 12, opacity: !pick || busy ? 0.6 : 1 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={busy ? "spin" : ""}><path d="M6 4l14 8-14 8V4z" /></svg>
          <span>{busy ? "Re-solving…" : "Run simulation"}</span>
        </button>
      </div>

      {out && <SimResults {...out} />}
    </>
  );
}

function SimResults({ nom, sim, name }: { nom: RunResult; sim: RunResult; name: string }) {
  const a = nom.best.m, b = sim.best.m;
  const dm = pct(a.makespan, b.makespan), dc = pct(nom.bestMoney, sim.bestMoney);
  const kpis = [
    { l: "Makespan", v: (b.makespan / 24).toFixed(1) + "d", d: dm, inv: true },
    { l: "Projected cost", v: "$" + Math.round(sim.bestMoney / 1000) + "K", d: dc, inv: true },
    { l: "On-time", v: (b.onTime * 100).toFixed(1) + "%", d: Math.round((b.onTime - a.onTime) * 100), inv: false, pp: true },
    { l: "Utilization", v: Math.round(b.util * 100) + "%", d: pct(a.util, b.util), inv: false },
  ];
  return (
    <div style={{ marginTop: 22 }}>
      <div className="grid g-4 stagger" style={{ marginBottom: 18 }}>
        {kpis.map((k, i) => {
          const good = k.inv ? k.d <= 0 : k.d >= 0;
          const col = good ? "var(--emerald)" : "var(--crimson)";
          const arrow = k.d > 0 ? "▲" : k.d < 0 ? "▼" : "■";
          const dtxt = k.pp ? `${k.d > 0 ? "+" : ""}${k.d} pp` : `${k.d > 0 ? "+" : ""}${k.d}%`;
          return (
            <div className="card glass res-kpi" key={i}>
              <div className="rl">{k.l}</div><div className="rv">{k.v}</div>
              <div className="rd" style={{ color: col }}>{arrow} {dtxt} vs nominal</div>
            </div>
          );
        })}
      </div>
      <div className="card glass card-pad stagger">
        <div className="card-head"><h3>What the engine did</h3><span className="link">Re-solved under scenario</span></div>
        <p style={{ fontSize: 13.5, color: "var(--text-dim)", lineHeight: 1.7 }}>
          Under “{name}”, the engine re-solved {b.mm} available machines across {b.n ?? 250} jobs.
          Makespan {dm >= 0 ? "rose" : "fell"} {Math.abs(dm)}% and projected cost {dc >= 0 ? "increased" : "dropped"} {Math.abs(dc)}%,
          holding on-time delivery at {(b.onTime * 100).toFixed(1)}%.{" "}
          {dm > 8 ? "Recommendation: add capacity or pull Tier-A jobs earlier to protect deadlines."
            : "The optimized schedule absorbs this scenario with minimal disruption."}
        </p>
      </div>
    </div>
  );
}
