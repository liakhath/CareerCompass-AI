from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator


class StudentProfile(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=100)
    education_level: Optional[str] = Field(default=None, max_length=60)
    interests: List[str] = Field(default_factory=list, max_length=30)
    skills: List[str] = Field(default_factory=list, max_length=30)
    subjects: List[str] = Field(default_factory=list, max_length=30)
    work_styles: List[str] = Field(default_factory=list, max_length=20)
    goals: Optional[str] = Field(default=None, max_length=2000)
    academic_score: Optional[float] = Field(default=None, ge=0, le=100)

    @field_validator("interests", "skills", "subjects", "work_styles")
    @classmethod
    def clean_lists(cls, values):
        cleaned = []
        seen = set()
        for item in values or []:
            item = str(item).strip()
            key = item.casefold()
            if item and key not in seen:
                cleaned.append(item)
                seen.add(key)
        return cleaned

    @field_validator("full_name", "education_level", "goals")
    @classmethod
    def strip_optional_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class RecommendationRequest(StudentProfile):
    top_k: int = Field(default=5, ge=1, le=10)
    profile_id: Optional[int] = Field(default=None, ge=1)

    @model_validator(mode="after")
    def require_profile_signal(self):
        if not (self.interests or self.skills or self.subjects or self.work_styles or (self.goals and self.goals.strip())):
            raise ValueError("Provide at least one interest, skill, subject, work style, or career goal.")
        return self


class SavedRecommendationRequest(BaseModel):
    top_k: int = Field(default=5, ge=1, le=10)


class CareerSummary(BaseModel):
    career_id: str
    title: str
    category: str
    summary: str
    interests: List[str]
    skills: List[str]
    subjects: List[str]


class CareerDetail(CareerSummary):
    work_styles: List[str]
    responsibilities: List[str]
    education_path: str
    skill_gaps: List[str]
    roadmap: Dict[str, str]
    resources: List[str]


class RecommendationItem(BaseModel):
    career_id: str
    title: str
    category: str
    summary: str
    match_score: float
    match_label: str
    matched_interests: List[str]
    matched_skills: List[str]
    matched_subjects: List[str]
    strengths: List[str]
    skill_gaps: List[str]
    explanation: List[str]
    education_path: str
    responsibilities: List[str]
    roadmap: Dict[str, str]
    resources: List[str]


class RecommendationResponse(BaseModel):
    request_id: int
    profile_id: Optional[int]
    model: str
    disclaimer: str
    recommendations: List[RecommendationItem]


class ProfileCreate(StudentProfile):
    pass


class ProfileResponse(BaseModel):
    profile_id: int
    created_at: str
    profile: StudentProfile


class CareerCompareRequest(BaseModel):
    career_ids: List[str] = Field(min_length=2, max_length=4)

    @field_validator("career_ids")
    @classmethod
    def unique_ids(cls, values):
        if len(set(values)) != len(values):
            raise ValueError("Choose each career only once.")
        return values


class CareerCompareResponse(BaseModel):
    careers: List[Dict[str, Any]]
    shared_skills: List[str]
    distinct_skills: Dict[str, List[str]]
    note: str
