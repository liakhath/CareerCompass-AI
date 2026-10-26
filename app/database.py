import json
import os
import sqlite3
from pathlib import Path
from typing import Optional, Any

DEFAULT_DB = Path(__file__).resolve().parent / "data" / "careercompass.db"


def db_path() -> Path:
    configured = os.getenv("CAREER_DB_PATH")
    path = Path(configured).expanduser() if configured else DEFAULT_DB
    if not path.is_absolute():
        path = (Path.cwd() / path).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def connect() -> sqlite3.Connection:
    con = sqlite3.connect(str(db_path()), timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


def init_db() -> None:
    with connect() as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
                updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS recommendation_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id INTEGER NULL,
                input_json TEXT NOT NULL,
                results_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
                FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE SET NULL
            )
        """)
        con.execute("CREATE INDEX IF NOT EXISTS idx_runs_profile ON recommendation_runs(profile_id, id DESC)")


def create_profile(profile: dict) -> dict:
    serialised = json.dumps(profile, ensure_ascii=False)
    with connect() as con:
        cur = con.execute("INSERT INTO profiles (profile_json) VALUES (?)", (serialised,))
        row = con.execute("SELECT id, created_at, profile_json FROM profiles WHERE id = ?", (cur.lastrowid,)).fetchone()
    return {"profile_id": row["id"], "created_at": row["created_at"], "profile": json.loads(row["profile_json"])}


def get_profile(profile_id: int) -> Optional[dict]:
    with connect() as con:
        row = con.execute("SELECT id, created_at, updated_at, profile_json FROM profiles WHERE id = ?", (profile_id,)).fetchone()
    if not row:
        return None
    return {"profile_id": row["id"], "created_at": row["created_at"], "updated_at": row["updated_at"],
            "profile": json.loads(row["profile_json"])}


def delete_profile(profile_id: int) -> bool:
    with connect() as con:
        cur = con.execute("DELETE FROM profiles WHERE id = ?", (profile_id,))
        return cur.rowcount > 0


def save_recommendation(profile_id: Optional[int], profile: dict, results: list[dict]) -> int:
    with connect() as con:
        cur = con.execute(
            "INSERT INTO recommendation_runs (profile_id, input_json, results_json) VALUES (?, ?, ?)",
            (profile_id, json.dumps(profile, ensure_ascii=False), json.dumps(results, ensure_ascii=False))
        )
        return int(cur.lastrowid)


def recommendation_history(profile_id: int, limit: int = 10) -> Optional[list[dict]]:
    with connect() as con:
        profile_exists = con.execute("SELECT 1 FROM profiles WHERE id = ?", (profile_id,)).fetchone()
        if not profile_exists:
            return None
        rows = con.execute(
            "SELECT id, created_at, input_json, results_json FROM recommendation_runs WHERE profile_id = ? ORDER BY id DESC LIMIT ?",
            (profile_id, limit)
        ).fetchall()
    history = []
    for row in rows:
        results = json.loads(row["results_json"])
        history.append({
            "request_id": row["id"],
            "created_at": row["created_at"],
            "profile": json.loads(row["input_json"]),
            "recommendations": [
                {"career_id": item["career_id"], "title": item["title"], "match_score": item["match_score"]}
                for item in results
            ]
        })
    return history
