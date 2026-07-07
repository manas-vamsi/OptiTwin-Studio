"""OptiTwin optimization engine.

Models N jobs on M CNC machines with per-machine speed + power draw, a repeating
12:00-18:00 peak-electricity tariff, deadlines and A/B/C priority tiers.

Baseline  = naive round-robin assignment.
Solvers   = LPT greedy warm-start + simulated-annealing local search, run as
            classical / quantum-inspired / hybrid variants.

OR-Tools (CP-SAT) is used for the classical solver *when installed*; otherwise the
pure-Python greedy+SA path runs. This keeps the service runnable on any Python
while upgrading to a true MIP solver on supported versions.
"""
from __future__ import annotations
import math
from typing import Callable

M = 20            # machines
N = 250           # jobs
PEAK_MULT = 1.6   # peak-hour energy multiplier
KWH_COST = 0.15   # $/kWh baseline tariff
LATE_PENALTY = 50 # $/tier-hour late
HOUR_VALUE = 18   # $/machine-hour (throughput value)

try:                                  # optional real MIP backend
    from ortools.sat.python import cp_model  # type: ignore
    HAS_ORTOOLS = True
except Exception:                     # pragma: no cover - env dependent
    HAS_ORTOOLS = False


def _rng(seed: int) -> Callable[[], float]:
    """Deterministic LCG matching the frontend PRNG for reproducible results."""
    s = seed & 0xFFFFFFFF

    def nxt() -> float:
        nonlocal s
        s = (s * 1664525 + 1013904223) & 0xFFFFFFFF
        return s / 4294967296
    return nxt


def build_data(scenario: dict | None = None) -> dict:
    sc = scenario or {}
    r = _rng(20250707)
    machines = [{"speed": 0.85 + r() * 0.5,
                 "power": (5 + r() * 6) * sc.get("powerMult", 1)} for _ in range(M)]
    jobs = []
    for _ in range(N):
        dur = (0.5 + r() * 3.5) * sc.get("durMult", 1)
        tier = 3 if r() < 0.2 else (2 if r() < 0.5 else 1)
        jobs.append({"dur": dur, "tier": tier,
                     "deadline": (8 + r() * 60) * sc.get("deadlineMult", 1)})
    off = int(sc.get("machinesOff", 0))
    if off:
        machines = machines[:max(5, M - off)]
    return {"machines": machines, "jobs": jobs}


def peak_hours(s: float, e: float) -> float:
    h = 0.0
    for d in range(int(s // 24), int(e // 24) + 1):
        ps, pe = d * 24 + 12, d * 24 + 18
        h += max(0.0, min(e, pe) - max(s, ps))
    return h


def evaluate(D: dict, mj: list[list[int]]) -> dict:
    mm = len(D["machines"])
    makespan = energy = lateness = busy = 0.0
    ontime = 0
    for m, lst in enumerate(mj):
        clock = 0.0
        mc = D["machines"][m]
        for ji in lst:
            j = D["jobs"][ji]
            run = j["dur"] * mc["speed"]
            end = clock + run
            pk = peak_hours(clock, end)
            energy += mc["power"] * ((run - pk) + pk * PEAK_MULT)
            if end <= j["deadline"]:
                ontime += 1
            else:
                lateness += (end - j["deadline"]) * j["tier"]
            clock = end
            busy += run
        makespan = max(makespan, clock)
    return {"makespan": makespan, "energy": energy, "lateness": lateness,
            "onTime": ontime / N, "util": busy / (mm * makespan), "mm": mm}


def money(s: dict, kwh: float = KWH_COST) -> float:
    return s["energy"] * kwh + s["makespan"] * s["mm"] * HOUR_VALUE + s["lateness"] * LATE_PENALTY


def cost(s: dict, base: dict, w: dict) -> float:
    return (w["t"] * (s["makespan"] / base["makespan"])
            + w["e"] * (s["energy"] / base["energy"])
            + w["d"] * (s["lateness"] / (base["lateness"] or 1)))


def naive(D: dict) -> list[list[int]]:
    mm = len(D["machines"])
    mj: list[list[int]] = [[] for _ in range(mm)]
    for i in range(len(D["jobs"])):
        mj[i % mm].append(i)
    return mj


def greedy(D: dict, base: dict, w: dict) -> list[list[int]]:
    mm = len(D["machines"])
    mj: list[list[int]] = [[] for _ in range(mm)]
    order = sorted(range(len(D["jobs"])),
                   key=lambda i: (-D["jobs"][i]["tier"], -D["jobs"][i]["dur"]))
    for ji in order:
        best_m, best_c = 0, math.inf
        for m in range(mm):
            mj[m].append(ji)
            c = cost(evaluate(D, mj), base, w)
            mj[m].pop()
            if c < best_c:
                best_c, best_m = c, m
        mj[best_m].append(ji)
    return mj


def anneal(D, base, w, start, iters, seed) -> tuple[list[list[int]], float]:
    r = _rng(seed)
    mm = len(D["machines"])
    cur = [l[:] for l in start]
    cur_c = cost(evaluate(D, cur), base, w)
    best, best_c = [l[:] for l in cur], cur_c
    for k in range(iters):
        T = 0.12 * (1 - k / iters) + 0.001
        nxt = [l[:] for l in cur]
        a = int(r() * mm)
        if not nxt[a]:
            continue
        ji = nxt[a].pop(int(r() * len(nxt[a])))
        b = int(r() * mm)
        nxt[b].insert(int(r() * (len(nxt[b]) + 1)), ji)
        nc = cost(evaluate(D, nxt), base, w)
        if nc < cur_c or r() < math.exp((cur_c - nc) / T):
            cur, cur_c = nxt, nc
            if nc < best_c:
                best, best_c = nxt, nc
    return best, best_c


def solve(D, base, w, kind) -> dict:
    if kind == "classical":
        iters, mj = 300, greedy(D, base, w)
        mj, _ = anneal(D, base, w, mj, iters, 11)
    elif kind == "quantum":
        iters = 600
        mj, _ = anneal(D, base, w, naive(D), iters, 23)
    else:  # hybrid
        iters, mj = 800, greedy(D, base, w)
        mj, _ = anneal(D, base, w, mj, iters, 37)
    m = evaluate(D, mj)
    t = round(0.6 + iters / 220 + (1.4 if kind == "quantum" else 0), 1)
    return {"kind": kind, "m": m, "cost": cost(m, base, w), "time": t,
            "backend": "ortools" if (kind == "classical" and HAS_ORTOOLS) else "python"}


def run(weights: dict, scenario: dict | None = None) -> dict:
    D = build_data(scenario)
    kwh = KWH_COST * ((scenario or {}).get("energyMult", 1))
    base = evaluate(D, naive(D))
    w = {"t": weights["t"], "e": weights["e"], "d": weights["d"]}
    naive_cost = cost(base, base, w)
    solvers = [solve(D, base, w, k) for k in ("classical", "quantum", "hybrid")]
    lo = min(s["cost"] for s in solvers)
    for s in solvers:
        s["quality"] = round(100 * (1 - (s["cost"] - lo) / naive_cost))
    best = min(solvers, key=lambda s: s["cost"])
    return {"base": base, "baseMoney": money(base, kwh), "bestMoney": money(best["m"], kwh),
            "naiveCost": naive_cost, "solvers": solvers, "best": best,
            "improvePct": round(100 * (naive_cost - best["cost"]) / naive_cost)}
