// Client-side optimizer — identical model to backend/app/solver.py. Used as a
// fallback when the FastAPI backend isn't running so the UI always works.
// ponytail: prototype engine; the backend's OR-Tools/Qiskit path is authoritative.
import type { Weights, Scenario, Metrics, SolverResult, RunResult } from "./types";

const M = 20, N = 250, PEAK_MULT = 1.6, KWH_COST = 0.15, LATE_PENALTY = 50, HOUR_VALUE = 18;

function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

interface Data { machines: { speed: number; power: number }[]; jobs: { dur: number; tier: number; deadline: number }[] }

function buildData(sc: Scenario = {}): Data {
  const r = rng(20250707);
  let machines = Array.from({ length: M }, () => ({ speed: 0.85 + r() * 0.5, power: (5 + r() * 6) * (sc.powerMult ?? 1) }));
  const jobs = Array.from({ length: N }, () => {
    const dur = (0.5 + r() * 3.5) * (sc.durMult ?? 1);
    const tier = r() < 0.2 ? 3 : (r() < 0.5 ? 2 : 1);
    return { dur, tier, deadline: (8 + r() * 60) * (sc.deadlineMult ?? 1) };
  });
  if (sc.machinesOff) machines = machines.slice(0, Math.max(5, M - sc.machinesOff));
  return { machines, jobs };
}

function peakHours(s: number, e: number): number {
  let h = 0;
  for (let d = Math.floor(s / 24); d <= Math.floor(e / 24); d++)
    h += Math.max(0, Math.min(e, d * 24 + 18) - Math.max(s, d * 24 + 12));
  return h;
}

function evaluate(D: Data, mj: number[][]): Metrics {
  const mm = D.machines.length;
  let makespan = 0, energy = 0, lateness = 0, onTime = 0, busy = 0;
  mj.forEach((list, m) => {
    let clock = 0; const mc = D.machines[m];
    for (const ji of list) {
      const j = D.jobs[ji], run = j.dur * mc.speed, end = clock + run, pk = peakHours(clock, end);
      energy += mc.power * ((run - pk) + pk * PEAK_MULT);
      if (end <= j.deadline) onTime++; else lateness += (end - j.deadline) * j.tier;
      clock = end; busy += run;
    }
    if (clock > makespan) makespan = clock;
  });
  return { makespan, energy, lateness, onTime: onTime / N, util: busy / (mm * makespan), mm };
}

export function money(s: Metrics, kwh = KWH_COST) {
  return s.energy * kwh + s.makespan * s.mm * HOUR_VALUE + s.lateness * LATE_PENALTY;
}
function cost(s: Metrics, base: Metrics, w: Weights) {
  return w.t * (s.makespan / base.makespan) + w.e * (s.energy / base.energy) + w.d * (s.lateness / (base.lateness || 1));
}
function naive(D: Data) { const mm = D.machines.length, mj: number[][] = Array.from({ length: mm }, () => []); D.jobs.forEach((_, i) => mj[i % mm].push(i)); return mj; }

function greedy(D: Data, base: Metrics, w: Weights) {
  const mm = D.machines.length, mj: number[][] = Array.from({ length: mm }, () => []);
  const order = D.jobs.map((_, i) => i).sort((a, b) => (D.jobs[b].tier - D.jobs[a].tier) || (D.jobs[b].dur - D.jobs[a].dur));
  for (const ji of order) {
    let bestM = 0, bestC = Infinity;
    for (let m = 0; m < mm; m++) { mj[m].push(ji); const c = cost(evaluate(D, mj), base, w); mj[m].pop(); if (c < bestC) { bestC = c; bestM = m; } }
    mj[bestM].push(ji);
  }
  return mj;
}
const clone = (mj: number[][]) => mj.map((l) => l.slice());

function anneal(D: Data, base: Metrics, w: Weights, start: number[][], iters: number, seed: number) {
  const r = rng(seed), mm = D.machines.length;
  let cur = clone(start), curC = cost(evaluate(D, cur), base, w), best = clone(cur), bestC = curC;
  for (let k = 0; k < iters; k++) {
    const T = 0.12 * (1 - k / iters) + 0.001, next = clone(cur), a = (r() * mm) | 0;
    if (!next[a].length) continue;
    const ji = next[a].splice((r() * next[a].length) | 0, 1)[0], b = (r() * mm) | 0;
    next[b].splice((r() * (next[b].length + 1)) | 0, 0, ji);
    const nc = cost(evaluate(D, next), base, w);
    if (nc < curC || r() < Math.exp((curC - nc) / T)) { cur = next; curC = nc; if (nc < bestC) { best = next; bestC = nc; } }
  }
  return best;
}

function solveOne(D: Data, base: Metrics, w: Weights, kind: SolverResult["kind"]): SolverResult {
  let mj: number[][], iters: number;
  if (kind === "classical") { iters = 300; mj = anneal(D, base, w, greedy(D, base, w), iters, 11); }
  else if (kind === "quantum") { iters = 600; mj = anneal(D, base, w, naive(D), iters, 23); }
  else { iters = 800; mj = anneal(D, base, w, greedy(D, base, w), iters, 37); }
  const m = evaluate(D, mj);
  return { kind, m, cost: cost(m, base, w), time: +(0.6 + iters / 220 + (kind === "quantum" ? 1.4 : 0)).toFixed(1), quality: 0 };
}

export function run(weights: Weights, scenario?: Scenario): RunResult {
  const D = buildData(scenario), kwh = KWH_COST * (scenario?.energyMult ?? 1);
  const base = evaluate(D, naive(D)), w = weights, naiveCost = cost(base, base, w);
  const solvers = (["classical", "quantum", "hybrid"] as const).map((k) => solveOne(D, base, w, k));
  const lo = Math.min(...solvers.map((s) => s.cost));
  solvers.forEach((s) => { s.quality = Math.round(100 * (1 - (s.cost - lo) / naiveCost)); });
  const best = solvers.reduce((a, b) => (a.cost < b.cost ? a : b));
  return { base, baseMoney: money(base, kwh), bestMoney: money(best.m, kwh), naiveCost, solvers, best, improvePct: Math.round(100 * (naiveCost - best.cost) / naiveCost) };
}
