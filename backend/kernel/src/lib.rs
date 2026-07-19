//! Rust port of the OptiTwin simulated-annealing kernel.
//!
//! Same model as `app/solver.py` (per-machine speed/power, 12:00-18:00 peak
//! tariff, tier-weighted lateness) and the same LCG PRNG, so a run with equal
//! seed and iteration count is reproducible against the Python implementation.
//! Python stays the orchestration layer; this is only the hot loop.

use pyo3::prelude::*;

const PEAK_MULT: f64 = 1.6;

struct Rng(u32);
impl Rng {
    fn next(&mut self) -> f64 {
        self.0 = self.0.wrapping_mul(1664525).wrapping_add(1013904223);
        self.0 as f64 / 4294967296.0
    }
}

fn peak_hours(s: f64, e: f64) -> f64 {
    let mut h = 0.0;
    let mut d = (s / 24.0).floor() as i64;
    let last = (e / 24.0).floor() as i64;
    while d <= last {
        let (ps, pe) = (d as f64 * 24.0 + 12.0, d as f64 * 24.0 + 18.0);
        h += (e.min(pe) - s.max(ps)).max(0.0);
        d += 1;
    }
    h
}

struct Problem {
    speed: Vec<f64>,
    power: Vec<f64>,
    dur: Vec<f64>,
    tier: Vec<f64>,
    deadline: Vec<f64>,
}

/// (makespan, energy, lateness) — mirrors solver.evaluate()
fn evaluate(p: &Problem, mj: &[Vec<usize>]) -> (f64, f64, f64) {
    let (mut makespan, mut energy, mut lateness) = (0.0f64, 0.0f64, 0.0f64);
    for (m, lst) in mj.iter().enumerate() {
        let mut clock = 0.0;
        for &ji in lst {
            let run = p.dur[ji] * p.speed[m];
            let end = clock + run;
            let pk = peak_hours(clock, end);
            energy += p.power[m] * ((run - pk) + pk * PEAK_MULT);
            if end > p.deadline[ji] {
                lateness += (end - p.deadline[ji]) * p.tier[ji];
            }
            clock = end;
        }
        makespan = makespan.max(clock);
    }
    (makespan, energy, lateness)
}

fn cost(s: (f64, f64, f64), base: (f64, f64, f64), w: (f64, f64, f64)) -> f64 {
    w.0 * (s.0 / base.0)
        + w.1 * (s.1 / base.1)
        + w.2 * (s.2 / if base.2 != 0.0 { base.2 } else { 1.0 })
}

/// Simulated-annealing local search over job-to-machine assignments.
/// Returns the best machine job lists found.
#[pyfunction]
#[allow(clippy::too_many_arguments)]
fn anneal(
    speed: Vec<f64>,
    power: Vec<f64>,
    dur: Vec<f64>,
    tier: Vec<f64>,
    deadline: Vec<f64>,
    start: Vec<Vec<usize>>,
    base: (f64, f64, f64),
    w: (f64, f64, f64),
    iters: u32,
    seed: u32,
) -> PyResult<Vec<Vec<usize>>> {
    let p = Problem { speed, power, dur, tier, deadline };
    let mm = p.speed.len();
    let mut rng = Rng(seed);
    let mut cur = start;
    let mut cur_c = cost(evaluate(&p, &cur), base, w);
    let mut best = cur.clone();
    let mut best_c = cur_c;
    for k in 0..iters {
        let t = 0.12 * (1.0 - k as f64 / iters as f64) + 0.001;
        let a = (rng.next() * mm as f64) as usize;
        if cur[a].is_empty() {
            continue;
        }
        let mut nxt = cur.clone();
        let pick = (rng.next() * nxt[a].len() as f64) as usize;
        let ji = nxt[a].remove(pick);
        let b = (rng.next() * mm as f64) as usize;
        let pos = (rng.next() * (nxt[b].len() + 1) as f64) as usize;
        nxt[b].insert(pos, ji);
        let nc = cost(evaluate(&p, &nxt), base, w);
        if nc < cur_c || rng.next() < ((cur_c - nc) / t).exp() {
            cur = nxt;
            cur_c = nc;
            if nc < best_c {
                best = cur.clone();
                best_c = nc;
            }
        }
    }
    Ok(best)
}

#[pymodule]
fn optitwin_kernel(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(anneal, m)?)?;
    Ok(())
}
