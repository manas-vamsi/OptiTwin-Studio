"""QUBO formulation for the job-to-machine assignment.

Binary x[i,j] = 1 if job i runs on machine j. The one-job-one-machine rule
becomes a penalty  P * (sum_j x[i,j] - 1)^2  folded into the objective, giving
a Quadratic Unconstrained Binary Optimization matrix Q (upper-triangular).

Returned sparse so it stays small; this is the same mapping a Qiskit/D-Wave
backend would anneal. numpy is optional — pure-Python dict fallback is used.
"""
from __future__ import annotations


def build_qubo(n_jobs: int, n_machines: int, penalty: float = 8.0) -> dict:
    """Return a sparse QUBO {(a,b): coeff} for the one-hot assignment penalty."""
    Q: dict[tuple[int, int], float] = {}

    def idx(i: int, j: int) -> int:
        return i * n_machines + j

    def add(a: int, b: int, v: float) -> None:
        key = (a, b) if a <= b else (b, a)
        Q[key] = Q.get(key, 0.0) + v

    # (sum_j x_ij - 1)^2 = sum_j x_ij + 2*sum_{j<k} x_ij x_ik - 2*sum_j x_ij + 1
    for i in range(n_jobs):
        for j in range(n_machines):
            add(idx(i, j), idx(i, j), penalty * (1 - 2))      # linear (diagonal)
            for k in range(j + 1, n_machines):
                add(idx(i, j), idx(i, k), penalty * 2)         # quadratic
    return Q


def qubo_summary(n_jobs: int = 250, n_machines: int = 20, penalty: float = 8.0) -> dict:
    Q = build_qubo(n_jobs, n_machines, penalty)
    dim = n_jobs * n_machines
    sample = [{"i": a, "j": b, "q": round(v, 2)} for (a, b), v in list(Q.items())[:6]]
    return {"dim": dim, "shape": f"{dim}x{dim}", "nnz": len(Q),
            "penalty": penalty, "sample": sample}


if __name__ == "__main__":
    print(qubo_summary(4, 3))
