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


def test_qubo_objective_and_decode():
    D = solver.build_data()
    D = {"jobs": D["jobs"][:6], "machines": D["machines"][:3]}
    w = {"t": 0.7, "e": 0.55, "d": 0.9}
    Q = qubo.build_qubo(D, w)
    # diagonal must carry objective terms, not just the bare one-hot penalty
    diags = {v for (a, b), v in Q.items() if a == b}
    assert len(diags) > 1, "diagonal has no per-assignment objective terms"
    # decode repairs invalid samples: every job on exactly one machine
    mj = qubo.decode({}, 6, 3)
    assert sorted(j for lst in mj for j in lst) == list(range(6))


def test_real_backends_report_truthfully():
    R = solver.run({"t": 0.7, "e": 0.55, "d": 0.9})
    for s in R["solvers"]:
        expected = {"classical": {"cpsat", "python"},
                    "quantum": {"neal", "python"},
                    "hybrid": {"neal+sa", "python"}}[s["kind"]]
        assert s["backend"] in expected
        assert s["time"] >= 0
    if solver.HAS_ORTOOLS:
        assert R["solvers"][0]["backend"] == "cpsat"
    if solver.HAS_NEAL:
        assert R["solvers"][1]["backend"] == "neal"


def test_custom_problem_counts():
    R = solver.run({"t": 0.7, "e": 0.55, "d": 0.9}, None, {"nMachines": 3, "nJobs": 12})
    m = R["best"]["m"]
    assert m["mm"] == 3 and m["n"] == 12
    assert 0 <= m["onTime"] <= 1
    assert R["best"]["cost"] <= R["naiveCost"] + 1e-6


def test_custom_problem_explicit_lists():
    pb = {"machines": [{"speed": 1.0, "power": 5.0}],
          "jobs": [{"dur": 2.0, "tier": 3, "deadline": 10.0},
                   {"dur": 1.0, "tier": 1, "deadline": 10.0}]}
    R = solver.run({"t": 0.7, "e": 0.55, "d": 0.9}, None, pb)
    m = R["best"]["m"]
    # one machine, two jobs: makespan is exactly the summed runtime, all on time
    assert m["mm"] == 1 and m["n"] == 2
    assert abs(m["makespan"] - 3.0) < 1e-9
    assert m["onTime"] == 1.0
    # scenario multipliers apply on top of explicit lists
    R2 = solver.run({"t": 0.7, "e": 0.55, "d": 0.9}, {"durMult": 2.0}, pb)
    assert abs(R2["best"]["m"]["makespan"] - 6.0) < 1e-9


def test_db_persistence_or_graceful_noop():
    from app import db
    w = {"t": 0.7, "e": 0.55, "d": 0.9}
    if db.available():
        R = solver.run(w)
        rid = db.save_run(w, None, R)
        assert rid is not None
        assert db.get_run(rid)["result"]["improvePct"] == R["improvePct"]
        assert any(r["id"] == rid for r in db.list_runs())
        print(f"  (postgres live: run {rid} round-tripped)")
    else:
        # no DB -> every call is a quiet no-op, nothing raises
        assert db.save_run(w, None, {"improvePct": 0, "best": {"kind": "x", "backend": "y"}}) is None
        assert db.list_runs() == []
        assert db.get_run(1) is None
        print("  (no postgres: graceful no-op verified)")


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"PASS {name}")
    print("all tests passed")
