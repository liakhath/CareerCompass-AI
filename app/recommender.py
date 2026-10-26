import json
import re
from pathlib import Path
from typing import Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA_PATH = Path(__file__).resolve().parent / "data" / "careers.json"
with DATA_PATH.open("r", encoding="utf-8") as f:
    _DATA = json.load(f)

CAREERS: list[dict[str, Any]] = _DATA["careers"]
OPTIONS: dict[str, Any] = _DATA["options"]
CAREERS_BY_ID = {item["career_id"]: item for item in CAREERS}
MODEL_NAME = "TF-IDF + cosine similarity with explainable profile overlap"


def _norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").casefold()).strip()


def _as_set(values: list[str]) -> set[str]:
    return {_norm(v) for v in values if _norm(v)}


def _career_text(career: dict) -> str:
    values = [career["title"], career["category"], career["summary"]]
    for field in ("interests", "skills", "subjects", "work_styles", "responsibilities"):
        values.extend(career.get(field, []))
    return " ".join(values)


def recommend(profile: dict, top_k: int = 5) -> list[dict]:
    student_parts = []
    for field in ("interests", "skills", "subjects", "work_styles"):
        student_parts.extend(profile.get(field) or [])
    if profile.get("goals"):
        student_parts.append(profile["goals"])
    student_text = " ".join(str(x) for x in student_parts).strip()
    if not student_text:
        raise ValueError("Provide at least one interest, skill, subject, work style, or career goal.")

    corpus = [_career_text(c) for c in CAREERS] + [student_text]
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True)
    matrix = vectorizer.fit_transform(corpus)
    semantic_scores = cosine_similarity(matrix[-1], matrix[:-1]).flatten()

    user_interests = _as_set(profile.get("interests") or [])
    user_skills = _as_set(profile.get("skills") or [])
    user_subjects = _as_set(profile.get("subjects") or [])
    user_work_styles = _as_set(profile.get("work_styles") or [])

    ranked = []
    for index, career in enumerate(CAREERS):
        c_interests = _as_set(career["interests"])
        c_skills = _as_set(career["skills"])
        c_subjects = _as_set(career["subjects"])
        c_work_styles = _as_set(career["work_styles"])

        matched_interests = sorted(user_interests & c_interests)
        matched_skills = sorted(user_skills & c_skills)
        matched_subjects = sorted(user_subjects & c_subjects)
        matched_work_styles = sorted(user_work_styles & c_work_styles)

        # Score components are normalised to the dimensions the student actually supplied.
        components = [(0.40, float(semantic_scores[index]))]
        if user_skills:
            components.append((0.30, len(matched_skills) / len(user_skills)))
        if user_interests:
            components.append((0.20, len(matched_interests) / len(user_interests)))
        if user_subjects:
            components.append((0.10, len(matched_subjects) / len(user_subjects)))
        if user_work_styles:
            components.append((0.10, len(matched_work_styles) / len(user_work_styles)))

        # Keep the semantic component meaningful when optional dimensions are present.
        weight_total = sum(weight for weight, _ in components)
        score = 100 * sum(weight * value for weight, value in components) / weight_total
        strengths = [x for x in career["skills"] if _norm(x) in user_skills]
        gaps = [x for x in career["skill_gaps"] if _norm(x) not in user_skills][:5]

        explanation = []
        if matched_interests:
            explanation.append("Interest match: " + ", ".join(matched_interests))
        if matched_skills:
            explanation.append("Skill match: " + ", ".join(matched_skills))
        if matched_subjects:
            explanation.append("Subject match: " + ", ".join(matched_subjects))
        if matched_work_styles:
            explanation.append("Work-style match: " + ", ".join(matched_work_styles))
        if not explanation:
            explanation.append("This result is based mainly on text similarity with the career goals you entered.")

        if score >= 55:
            label = "High alignment"
        elif score >= 35:
            label = "Worth exploring"
        else:
            label = "Explore further"

        ranked.append({
            "career_id": career["career_id"],
            "title": career["title"],
            "category": career["category"],
            "summary": career["summary"],
            "match_score": round(float(score), 1),
            "match_label": label,
            "matched_interests": sorted(matched_interests),
            "matched_skills": sorted(matched_skills),
            "matched_subjects": sorted(matched_subjects),
            "strengths": strengths,
            "skill_gaps": gaps,
            "explanation": explanation,
            "education_path": career["education_path"],
            "responsibilities": career["responsibilities"],
            "roadmap": career["roadmap"],
            "resources": career["resources"]
        })

    ranked.sort(key=lambda item: item["match_score"], reverse=True)
    return ranked[:top_k]
