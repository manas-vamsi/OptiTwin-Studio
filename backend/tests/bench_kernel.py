"""Benchmark: pure-Python SA vs the Rust kernel on identical work.

Run:  python tests/bench_kernel.py
"""
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import solver

ITERS = 2000
SEED = 11


def python_anneal(D, base, w, start):
    saved, solver.HAS_RUST = solver.HAS_RUST, False
    try:
        t0 = time.perf_counter()
        mj, c = solver.anneal(D, base, w, start, ITERS, SEED)
        return time.perf_counter() - t0, c
    finally:
        solver.HAS_RUST = saved


def rust_anneal(D, base, w, start):
    import optitwin_kernel
    t0 = time.perf_counter()
    mj = optitwin_kernel.anneal(
        [m["speed"] for m in D["machines"]], [m["power"] for m in D["machines"]],
        [j["dur"] for j in D["jobs"]], [float(j["tier"]) for j in D["jobs"]],
        [j["deadline"] for j in D["jobs"]], start,
        (base["makespan"], base["energy"], base["lateness"]),
        (w["t"], w["e"], w["d"]), ITERS, SEED)
    return time.perf_counter() - t0, solver.cost(solver.evaluate(D, mj), base, w)


if __name__ == "__main__":
    if not solver.HAS_RUST:
        sys.exit("optitwin_kernel not installed — build it: cd kernel && maturin build --release")
    D = solver.build_data()
    w = {"t": 0.7, "e": 0.55, "d": 0.9}
    base = solver.evaluate(D, solver.naive(D))
    start = solver.naive(D)
    tp, cp = python_anneal(D, base, w, start)
    tr, cr = rust_anneal(D, base, w, start)
    assert abs(cp - cr) < 1e-9, f"kernel diverges from python: {cp} vs {cr}"
    print(f"{ITERS} SA iterations, 250 jobs x 20 machines")
    print(f"python : {tp:7.2f}s  ({ITERS/tp:8.0f} iters/s)")
    print(f"rust   : {tr:7.2f}s  ({ITERS/tr:8.0f} iters/s)")
    print(f"speedup: {tp/tr:.0f}x   (identical result, same seed: cost {cr:.4f})")
