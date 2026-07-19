# OptiTwin Studio — 3-minute demo script

**One-liner:** *"Describe a factory problem in plain language; OptiTwin builds a
digital twin, solves it three genuinely different ways — including the exact
QUBO pipeline a quantum annealer runs — and explains every decision in dollars."*

## Setup (before anyone walks up)

```bash
docker compose up          # or: uvicorn in backend/ + npm run dev in frontend/
```

Open http://localhost:3000. Check http://localhost:8000/health shows
`{"ok": true, "ortools": true, "neal": true, "rust": true}` — that's your
proof slide if anyone asks whether the solvers are real.

## The walkthrough

1. **Problem** (30 s) — "A plant has 250 jobs across 20 CNC machines. Machines
   differ in speed and power draw, electricity costs 1.6× between 12:00 and
   18:00, and every job has a deadline and an A/B/C priority." Show the
   extracted resource/constraint/objective chips — edit one live.

2. **Digital Twin** (20 s) — the live graph of the plant. Click a machine node,
   show speed/power in the inspector. "This model is what the solvers optimize."

3. **Optimization** (60 s) — the core. Hit solve and narrate while it runs
   (~10 s of real computation):
   - "Baseline is naive round-robin — that's the cost to beat."
   - "**Classical** is Google OR-Tools CP-SAT — the same C++ MIP engine used in
     real factory schedulers."
   - "**Quantum-inspired** builds a 5,000-variable QUBO — 675,000 nonzero
     coefficients — and anneals it with D-Wave's sampler. Identical matrix and
     pipeline a quantum QPU consumes; swap the sampler, get real quantum
     hardware."
   - "**Hybrid** splits the problem: QUBO annealing assigns jobs to machines,
     simulated annealing sequences them — because assignment is
     QUBO-expressible and sequencing isn't."
   - Point at the results: **~50% cost reduction**, 96% on-time, each solver
     reporting its true engine and wall-clock time.

4. **Simulation** (30 s) — "What if three machines fail tomorrow?" Run the
   scenario, watch capacity drop and the optimizer re-plan around it.

5. **Reports** (20 s) — export the executive PDF. "Every number traces back to
   the solver — this is what lands on the plant manager's desk."

## Q&A ammunition

- **"Is the quantum part real?"** — The QUBO is real (show `/api/qubo` or
  `qubo.py`): objective terms + one-hot penalty, annealed by `dwave-samplers`.
  We say *quantum-inspired* precisely because it runs on a classical annealer —
  the formulation is QPU-ready, the hardware isn't in the booth. A true QAOA
  run would fit ~12 variables today; our problem is 5,000. That gap **is** the
  honest story.
- **"Why is classical better than quantum here?"** — Correct observation!
  CP-SAT is exact and mature; QUBO annealing pays a penalty-formulation tax.
  The platform's point is measuring that honestly, not cheerleading quantum.
- **"What's the Rust for?"** — The SA hot loop, via PyO3: 56× faster,
  bit-identical results (same PRNG). We spend the speedup on 50× search depth,
  which is why hybrid closes most of the gap to CP-SAT. Run
  `python backend/tests/bench_kernel.py` live if they want proof.
- **"How does it scale?"** — CP-SAT: this size in ~3 s, caps gracefully via
  time budget. QUBO: grows as jobs×machines binaries; past ~10k variables you'd
  move to decomposition (per-cell subproblems) — roadmap.
- **"Production-ready?"** — CI (4 jobs incl. a Rust-vs-Python equivalence
  check), Docker Compose one-command start, triple fallback chain (CP-SAT →
  pure-Python → in-browser optimizer): the demo cannot go dark.
