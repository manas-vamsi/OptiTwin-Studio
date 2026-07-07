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


class SolveRequest(BaseModel):
    weights: Weights = Weights()
    scenario: Scenario | None = None
