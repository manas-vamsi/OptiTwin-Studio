# OptiTwin Studio

Enterprise decision-intelligence platform — **Design • Simulate • Optimize • Explain**.
Describe an operations problem in plain language; the platform builds a digital twin,
solves it with classical / quantum-inspired / hybrid optimizers, simulates scenarios,
and explains every decision.

> Quantum is one solver, not the point. This is an optimization platform.

## Structure

```
frontend/    Next.js 15 · React 19 · TypeScript · Tailwind        (the UI)
  app/         App Router pages (dashboard, problem, twin, optimization, simulation, reports)
  components/  Sidebar, Topbar, KPI/spark widgets
  lib/         optimizer.ts (client fallback), api.ts, types.ts
backend/     FastAPI · Python                                      (the solver service)
  app/         main.py (API), solver.py (engine), qubo.py (QUBO), models.py
  tests/       runnable solver tests
prototype/   original single-file design reference (index.html)
```

## Run

**Backend**
```bash
cd backend
python -m venv .venv && .venv/Scripts/activate   # Windows;  source .venv/bin/activate on *nix
pip install -r requirements.txt
uvicorn app.main:app --reload            # http://localhost:8000
python tests/test_solver.py              # run tests
```

**Frontend**
```bash
cd frontend
npm install
npm run dev                              # http://localhost:3000  (proxies /api -> :8000)
```

The frontend calls the backend `/api/solve`; if the backend is down it falls back to the
identical client-side optimizer, so the UI always works.

## The optimizer

Real operations-research, not canned numbers:

- **Model** — N jobs on M machines, per-machine speed + power, 12–18h peak tariff, deadlines, A/B/C priority tiers.
- **Baseline** — naive round-robin.
- **Solvers** — LPT greedy warm-start + simulated-annealing local search (classical / quantum-inspired / hybrid).
- **QUBO** — one-hot assignment penalty mapped to a sparse Q matrix (`qubo.py`).

OR-Tools (CP-SAT) and Qiskit are **optional** imports — enabled on a supported Python
(3.11/3.12); otherwise the pure-Python path runs.

## Roadmap (view-by-view PRs)

- [x] Dashboard, Optimization (backend-integrated)
- [x] Problem (AI extraction UI — editable resource/constraint/objective chips)
- [ ] Digital Twin (React Flow graph)
- [x] Simulation (scenario library — 6 what-ifs, engine-driven deltas)
- [x] Reports (executive/optimization/technical + CSV/PDF)
