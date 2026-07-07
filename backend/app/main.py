from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import SolveRequest
from . import solver, qubo

app = FastAPI(title="OptiTwin Studio API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "ortools": solver.HAS_ORTOOLS}


@app.post("/api/solve")
def solve(req: SolveRequest) -> dict:
    sc = req.scenario.model_dump() if req.scenario else None
    return solver.run(req.weights.model_dump(), sc)


@app.get("/api/qubo")
def qubo_preview(jobs: int = 250, machines: int = 20) -> dict:
    return qubo.qubo_summary(jobs, machines)
