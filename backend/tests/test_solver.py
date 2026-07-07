"""Runnable without pytest:  python backend/tests/test_solver.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import solver, qubo


def test_optimizer_beats_baseline():
    R = solver.run({"t": 0.7, "e": 0.55, "d": 0.9})
    base, best = R["base"], R["best"]["m"]
    assert best["makespan"] <= base["makespan"] + 1e-6, "makespan not improved"
    assert R["best"]["cost"] <= R["naiveCost"] + 1e-6, "weighted cost not improved"
    assert 0 < best["util"] <= 1.0001
    assert len(R["solvers"]) == 3


def test_machine_failure_drops_capacity():
    nom = solver.run({"t": 0.7, "e": 0.55, "d": 0.9})
    fail = solver.run({"t": 0.7, "e": 0.55, "d": 0.9}, {"machinesOff": 3})
    assert fail["best"]["m"]["mm"] == nom["best"]["m"]["mm"] - 3
    assert fail["best"]["m"]["makespan"] >= nom["best"]["m"]["makespan"]


def test_qubo_shape():
    q = qubo.qubo_summary(4, 3)
    assert q["dim"] == 12 and q["nnz"] > 0


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"PASS {name}")
    print("all tests passed")
