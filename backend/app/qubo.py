"""QUBO formulation for the job-to-machine assignment.

Binary x[i,j] = 1 if job i runs on machine j. The matrix encodes:

  objective   linear terms   w_t * time_ij + w_e * energy_ij   (job i on machine j)
              quadratic      w_t * load-balance: minimizing sum_j load_j^2 spreads
                             work across machines (a standard makespan proxy)
  constraint  penalty        P * (sum_j x_ij - 1)^2  — one job, one machine

Coefficients are normalized so the penalty dominates the objective. The result
is a sparse upper-triangular Q {(a,b): coeff} — the exact form a D-Wave QPU or
any simulated annealer consumes. Sequencing within a machine is not QUBO-
expressible; callers order jobs by deadline (EDD) after decoding.
"""
from __future__ import annotations


def _idx(i: int, j: int, mm: int) -> int:
    return i * mm + j


def build_qubo(D: dict, w: dict, penalty: float = 8.0) -> dict:
    """Sparse QUBO for the full assignment problem (objective + one-hot penalty)."""
    jobs, machines = D["jobs"], D["machines"]
    n, mm = len(jobs), len(machines)
    Q: dict[tuple[int, int], float] = {}

    def add(a: int, b: int, v: float) -> None:
        key = (a, b) if a <= b else (b, a)
        Q[key] = Q.get(key, 0.0) + v

    # normalize so objective coefficients are O(1) and the penalty dominates
    avg_load = sum(j["dur"] for j in jobs) / mm
    max_pow = max(m["power"] for m in machines)

    for i, job in enumerate(jobs):
        for j, mc in enumerate(machines):
            run = job["dur"] * mc["speed"]
            time_c = run / avg_load
            energy_c = run * mc["power"] / (avg_load * max_pow)
            add(_idx(i, j, mm), _idx(i, j, mm),
                w["t"] * time_c + w["e"] * energy_c + penalty * (1 - 2))
            for k in range(j + 1, mm):                     # one-hot quadratic
                add(_idx(i, j, mm), _idx(i, k, mm), penalty * 2)

    # load-balance: sum_j (sum_i run_ij x_ij)^2 cross terms, scaled to stay
    # below the penalty. Squared-load is the classic QUBO makespan surrogate.
    lb = w["t"] / (avg_load * avg_load)
    for j, mc in enumerate(machines):
        s2 = mc["speed"] * mc["speed"]
        for i in range(n):
            di = jobs[i]["dur"]
            for i2 in range(i + 1, n):
                add(_idx(i, j, mm), _idx(i2, j, mm), 2 * lb * s2 * di * jobs[i2]["dur"])
    return Q


def decode(sample: dict, n: int, mm: int) -> list[list[int]]:
    """Binary sample -> machine job lists. Repairs jobs with 0 or 2+ machines set."""
    mj: list[list[int]] = [[] for _ in range(mm)]
    loads = [0.0] * mm
    for i in range(n):
        chosen = [j for j in range(mm) if sample.get(_idx(i, j, mm), 0)]
        j = chosen[0] if len(chosen) == 1 else min(range(mm), key=lambda j: loads[j])
        mj[j].append(i)
        loads[j] += 1
    return mj


def qubo_summary(n_jobs: int = 250, n_machines: int = 20, penalty: float = 8.0) -> dict:
    from . import solver
    D = solver.build_data()
    D = {"jobs": D["jobs"][:n_jobs], "machines": D["machines"][:n_machines]}
    Q = build_qubo(D, {"t": 0.7, "e": 0.55, "d": 0.9}, penalty)
    dim = n_jobs * n_machines
    sample = [{"i": a, "j": b, "q": round(v, 3)} for (a, b), v in list(Q.items())[:6]]
    return {"dim": dim, "shape": f"{dim}x{dim}", "nnz": len(Q),
            "penalty": penalty, "sample": sample}
