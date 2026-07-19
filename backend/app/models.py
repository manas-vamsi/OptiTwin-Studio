from pydantic import BaseModel, Field


class Weights(BaseModel):
    t: float = Field(0.7, ge=0, le=1)   # minimize production time
    e: float = Field(0.55, ge=0, le=1)  # minimize energy
    d: float = Field(0.9, ge=0, le=1)   # maximize on-time delivery


class Scenario(BaseModel):
    machinesOff: int = 0
    durMult: float = 1.0
    energyMult: float = 1.0
    deadlineMult: float = 1.0
    powerMult: float = 1.0


class MachineSpec(BaseModel):
    speed: float = Field(..., gt=0, le=10)    # relative run-rate multiplier
    power: float = Field(..., gt=0, le=1000)  # kW draw


class JobSpec(BaseModel):
    dur: float = Field(..., gt=0, le=200)     # hours at speed 1.0
    tier: int = Field(1, ge=1, le=3)          # priority: 1=C .. 3=A
    deadline: float = Field(..., gt=0, le=10000)  # hours from now


class ProblemSpec(BaseModel):
    """Custom problem instance. Counts generate a deterministic dataset of
    that size; explicit machine/job lists override counts. Sizes are capped
    so every solver path (incl. the 675k-term QUBO) stays inside its time
    budget."""
    nMachines: int | None = Field(None, ge=1, le=25)
    nJobs: int | None = Field(None, ge=1, le=300)
    machines: list[MachineSpec] | None = Field(None, max_length=25)
    jobs: list[JobSpec] | None = Field(None, max_length=300)


class SolveRequest(BaseModel):
    weights: Weights = Weights()
    scenario: Scenario | None = None
    problem: ProblemSpec | None = None
