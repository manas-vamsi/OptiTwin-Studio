export interface Weights { t: number; e: number; d: number }
export interface Scenario {
  machinesOff?: number; durMult?: number; energyMult?: number;
  deadlineMult?: number; powerMult?: number;
}
export interface Metrics {
  makespan: number; energy: number; lateness: number;
  onTime: number; util: number; mm: number;
}
export interface SolverResult {
  kind: "classical" | "quantum" | "hybrid";
  m: Metrics; cost: number; time: number; quality: number; backend?: string;
}
export interface RunResult {
  base: Metrics; baseMoney: number; bestMoney: number; naiveCost: number;
  solvers: SolverResult[]; best: SolverResult; improvePct: number;
  rustKernel?: boolean;
}
