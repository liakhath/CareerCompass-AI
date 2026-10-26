import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app import database
from app.recommender import CAREERS, CAREERS_BY_ID, OPTIONS, MODEL_NAME, recommend
from app.schemas import (
    StudentProfile, RecommendationRequest, SavedRecommendationRequest,
    RecommendationResponse, ProfileCreate, ProfileResponse, CareerCompareRequest,
    CareerCompareResponse
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield


FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
FRONTEND_INDEX = FRONTEND_DIR / "index.html"

app = FastAPI(
    title="CareerCompass AI API",
    description=(
        "Backend API for an AI-based career exploration and recommendation system. "
        "Recommendations use TF-IDF text similarity and explainable profile overlap. "
        "Scores are relative match indicators, not probabilities of career success."
    ),
    version="1.0.0",
    contact={"name": "CareerCompass AI project"},
    lifespan=lifespan
)

origins_setting = os.getenv("FRONTEND_ORIGINS", "*")
allowed_origins = ["*"] if origins_setting.strip() == "*" else [
    origin.strip() for origin in origins_setting.split(",") if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

DISCLAIMER = (
    "For exploration only. Match scores reflect similarity to this application's career catalogue; "
    "they are not probabilities of career success and should not replace qualified career guidance."
)


# Serve the Stitch frontend from the same origin as the API so browser requests work locally.
if FRONTEND_DIR.exists():
    app.mount("/frontend", StaticFiles(directory=str(FRONTEND_DIR)), name="frontend")


@app.get("/", tags=["System"], include_in_schema=False)
def root():
    if not FRONTEND_INDEX.exists():
        raise HTTPException(status_code=500, detail="Frontend file not found. Expected frontend/index.html.")
    return FileResponse(str(FRONTEND_INDEX), media_type="text/html")


@app.get("/api/v1/health", tags=["System"])
def health():
    try:
        database.init_db()
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "model": MODEL_NAME,
        "career_count": len(CAREERS)
    }


@app.get("/api/v1/metadata", tags=["Reference data"])
def metadata():
    return {
        "options": OPTIONS,
        "career_categories": sorted({c["category"] for c in CAREERS}),
        "education_note": "Qualification, certification, and licensing rules vary by location and role."
    }


@app.get("/api/v1/careers", tags=["Careers"])
def list_careers(
    category: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None, max_length=100)
):
    results = CAREERS
    if category:
        results = [c for c in results if c["category"].casefold() == category.casefold()]
    if search:
        term = search.casefold()
        results = [
            c for c in results
            if term in c["title"].casefold()
            or term in c["summary"].casefold()
            or term in c["category"].casefold()
            or any(term in value.casefold() for key in ("interests", "skills", "subjects") for value in c[key])
        ]
    return {"count": len(results), "careers": results}


@app.get("/api/v1/careers/{career_id}", tags=["Careers"])
def career_detail(career_id: str):
    career = CAREERS_BY_ID.get(career_id)
    if not career:
        raise HTTPException(status_code=404, detail="Career not found.")
    return career


@app.post("/api/v1/recommendations", response_model=RecommendationResponse, tags=["Recommendations"])
def create_recommendations(payload: RecommendationRequest):
    profile_id = payload.profile_id
    profile_data = payload.model_dump(exclude={"top_k", "profile_id"})
    if profile_id is not None and database.get_profile(profile_id) is None:
        raise HTTPException(status_code=404, detail="Saved profile not found.")
    try:
        matches = recommend(profile_data, payload.top_k)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    request_id = database.save_recommendation(profile_id, profile_data, matches)
    return {
        "request_id": request_id,
        "profile_id": profile_id,
        "model": MODEL_NAME,
        "disclaimer": DISCLAIMER,
        "recommendations": matches
    }


@app.post("/api/v1/profiles", response_model=ProfileResponse, status_code=201, tags=["Profiles"])
def create_profile(payload: ProfileCreate):
    created = database.create_profile(payload.model_dump())
    return created


@app.get("/api/v1/profiles/{profile_id}", response_model=ProfileResponse, tags=["Profiles"])
def read_profile(profile_id: int):
    profile = database.get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Saved profile not found.")
    return {"profile_id": profile["profile_id"], "created_at": profile["created_at"], "profile": profile["profile"]}


@app.delete("/api/v1/profiles/{profile_id}", tags=["Profiles"])
def remove_profile(profile_id: int):
    deleted = database.delete_profile(profile_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Saved profile not found.")
    return {"deleted": True, "profile_id": profile_id}


@app.post("/api/v1/profiles/{profile_id}/recommendations", response_model=RecommendationResponse, tags=["Recommendations"])
def recommend_for_saved_profile(profile_id: int, payload: SavedRecommendationRequest):
    saved = database.get_profile(profile_id)
    if not saved:
        raise HTTPException(status_code=404, detail="Saved profile not found.")
    profile_data = saved["profile"]
    if not (profile_data.get("interests") or profile_data.get("skills") or profile_data.get("subjects")
            or profile_data.get("work_styles") or profile_data.get("goals")):
        raise HTTPException(status_code=422, detail="The saved profile needs at least one interest, skill, subject, work style, or goal.")
    matches = recommend(profile_data, payload.top_k)
    request_id = database.save_recommendation(profile_id, profile_data, matches)
    return {
        "request_id": request_id,
        "profile_id": profile_id,
        "model": MODEL_NAME,
        "disclaimer": DISCLAIMER,
        "recommendations": matches
    }


@app.get("/api/v1/profiles/{profile_id}/history", tags=["Profiles"])
def get_profile_history(profile_id: int, limit: int = Query(default=10, ge=1, le=50)):
    history = database.recommendation_history(profile_id, limit)
    if history is None:
        raise HTTPException(status_code=404, detail="Saved profile not found.")
    return {"profile_id": profile_id, "count": len(history), "history": history}


@app.post("/api/v1/compare", response_model=CareerCompareResponse, tags=["Careers"])
def compare_careers(payload: CareerCompareRequest):
    missing = [career_id for career_id in payload.career_ids if career_id not in CAREERS_BY_ID]
    if missing:
        raise HTTPException(status_code=404, detail={"message": "One or more career IDs were not found.", "missing": missing})
    selected = [CAREERS_BY_ID[career_id] for career_id in payload.career_ids]
    sets = {c["career_id"]: set(c["skills"]) for c in selected}
    shared = set.intersection(*sets.values()) if sets else set()
    distinct = {
        c["career_id"]: sorted(sets[c["career_id"]] - shared)
        for c in selected
    }
    return {
        "careers": selected,
        "shared_skills": sorted(shared),
        "distinct_skills": distinct,
        "note": "Comparison supports exploration; role requirements vary by employer, seniority, and location."
    }
