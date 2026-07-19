// Shared custom-problem spec: parsed in the Problem view, consumed by the
// Optimization and Simulation views (and sent to the backend / local solver).
import type { ProblemSpec } from "./types";

const KEY = "optitwin.problem";
const CAPS = { machines: 25, jobs: 300 }; // mirror backend Pydantic caps

export function loadSpec(): ProblemSpec | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProblemSpec) : null;
  } catch {
    return null;
  }
}

export function saveSpec(spec: ProblemSpec | null) {
  if (typeof window === "undefined") return;
  if (spec) localStorage.setItem(KEY, JSON.stringify(spec));
  else localStorage.removeItem(KEY);
}

const clamp = (v: number, hi: number) => Math.max(1, Math.min(hi, Math.round(v)));

const MACHINE_WORDS = /(\d+)\s*(?:cnc\s+)?(?:machines?|lines?|stations?|printers?|ovens?|looms?|presses?|robots?|cells?)\b/i;
const JOB_WORDS = /(\d+)\s*(?:jobs?|orders?|trays?|parts?|units?|products?|batches?|items?|tasks?|lots?|pieces?)\b/i;

/** Pull machine/job counts out of a plain-language description. */
export function parseSpec(text: string): ProblemSpec | null {
  const m = MACHINE_WORDS.exec(text);
  const j = JOB_WORDS.exec(text);
  if (!m && !j) return null;
  const spec: ProblemSpec = {};
  if (m) spec.nMachines = clamp(+m[1], CAPS.machines);
  if (j) spec.nJobs = clamp(+j[1], CAPS.jobs);
  return spec;
}

/** Parse a jobs CSV: dur,tier,deadline per row (header row optional). */
export function parseJobsCsv(text: string): ProblemSpec["jobs"] | null {
  const jobs: NonNullable<ProblemSpec["jobs"]> = [];
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split(",").map((c) => c.trim());
    if (cells.length < 3) continue;
    const [dur, tier, deadline] = [parseFloat(cells[0]), parseInt(cells[1], 10), parseFloat(cells[2])];
    if ([dur, tier, deadline].some(Number.isNaN)) continue; // skips header rows too
    jobs.push({ dur: Math.max(0.01, dur), tier: Math.min(3, Math.max(1, tier)), deadline: Math.max(0.1, deadline) });
    if (jobs.length >= CAPS.jobs) break;
  }
  return jobs.length ? jobs : null;
}

export function specSummary(spec: ProblemSpec | null): { machines: number; jobs: number; custom: boolean } {
  return {
    machines: spec?.machines?.length ?? spec?.nMachines ?? 20,
    jobs: spec?.jobs?.length ?? spec?.nJobs ?? 250,
    custom: !!spec,
  };
}
