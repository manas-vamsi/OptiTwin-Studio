from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import SolveRequest
from . import solver, qubo, db

app = FastAPI(title="OptiTwin Studio API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "ortools": solver.HAS_ORTOOLS,
            "neal": solver.HAS_NEAL, "rust": solver.HAS_RUST,
            "db": db.available()}


@app.post("/api/solve")
def solve(req: SolveRequest) -> dict:
    weights = req.weights.model_dump()
    sc = req.scenario.model_dump() if req.scenario else None
    result = solver.run(weights, sc)
    result["runId"] = db.save_run(weights, sc, result)   # None if DB is off
    return result


@app.get("/api/runs")
def runs(limit: int = 20) -> list[dict]:
    return db.list_runs(limit)


@app.get("/api/runs/{run_id}")
def run_detail(run_id: int) -> dict:
    run = db.get_run(run_id)
    if run is None:
        raise HTTPException(404, "run not found (or persistence disabled)")
    return run


@app.get("/api/qubo")
def qubo_preview(jobs: int = 250, machines: int = 20) -> dict:
    return qubo.qubo_summary(jobs, machines)
