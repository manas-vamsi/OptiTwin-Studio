"""Postgres persistence for solve runs.

Same philosophy as the solvers: the database is optional. No DATABASE_URL,
unreachable server, or missing psycopg -> persistence quietly disables and
/api/solve keeps working. Nothing in the demo path can die because of the DB.
"""
from __future__ import annotations
import json
import os

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://optitwin:optitwin@localhost:5432/optitwin")

try:
    import psycopg
    HAS_PSYCOPG = True
except Exception:                     # pragma: no cover - env dependent
    HAS_PSYCOPG = False

_SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
    id          serial PRIMARY KEY,
    created_at  timestamptz NOT NULL DEFAULT now(),
    weights     jsonb NOT NULL,
    scenario    jsonb,
    result      jsonb NOT NULL,
    improve_pct int   NOT NULL,
    best_kind   text  NOT NULL,
    best_backend text NOT NULL
)
"""
_ready = False


def _conn():
    return psycopg.connect(DATABASE_URL, autocommit=True, connect_timeout=2)


def available() -> bool:
    global _ready
    if not HAS_PSYCOPG:
        return False
    if _ready:
        return True
    try:
        with _conn() as c:
            c.execute(_SCHEMA)
        _ready = True
    except Exception:
        return False
    return True


def save_run(weights: dict, scenario: dict | None, result: dict) -> int | None:
    """Persist a solve; returns the run id, or None if the DB is unavailable."""
    if not available():
        return None
    try:
        with _conn() as c:
            row = c.execute(
                "INSERT INTO runs (weights, scenario, result, improve_pct, best_kind, best_backend)"
                " VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (json.dumps(weights), json.dumps(scenario) if scenario else None,
                 json.dumps(result), result["improvePct"],
                 result["best"]["kind"], result["best"]["backend"])).fetchone()
            return row[0]
    except Exception:
        return None


def list_runs(limit: int = 20) -> list[dict]:
    if not available():
        return []
    with _conn() as c:
        rows = c.execute(
            "SELECT id, created_at, weights, scenario, improve_pct, best_kind, best_backend"
            " FROM runs ORDER BY id DESC LIMIT %s", (min(limit, 100),)).fetchall()
    return [{"id": r[0], "createdAt": r[1].isoformat(), "weights": r[2],
             "scenario": r[3], "improvePct": r[4], "bestKind": r[5],
             "bestBackend": r[6]} for r in rows]


def get_run(run_id: int) -> dict | None:
    if not available():
        return None
    with _conn() as c:
        r = c.execute(
            "SELECT id, created_at, weights, scenario, result FROM runs WHERE id = %s",
            (run_id,)).fetchone()
    if not r:
        return None
    return {"id": r[0], "createdAt": r[1].isoformat(), "weights": r[2],
            "scenario": r[3], "result": r[4]}
