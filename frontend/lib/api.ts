import type { Weights, Scenario, ProblemSpec, RunResult } from "./types";
import { run as localRun } from "./optimizer";

// Calls the FastAPI backend; falls back to the client optimizer if it's down.
export async function solve(weights: Weights, scenario?: Scenario, problem?: ProblemSpec | null): Promise<RunResult & { source: "backend" | "local" }> {
  try {
    const res = await fetch("/api/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weights, scenario: scenario ?? null, problem: problem ?? null }),
    });
    if (!res.ok) throw new Error(String(res.status));
    return { ...(await res.json()), source: "backend" };
  } catch {
    return { ...localRun(weights, scenario, problem ?? undefined), source: "local" };
  }
}
