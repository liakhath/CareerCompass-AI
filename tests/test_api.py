from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_and_careers():
    health = client.get("/api/v1/health")
    assert health.status_code == 200
    assert health.json()["career_count"] >= 10

    careers = client.get("/api/v1/careers")
    assert careers.status_code == 200
    assert careers.json()["count"] >= 10


def test_recommendations_returns_explanations():
    response = client.post("/api/v1/recommendations", json={
        "interests": ["Technology", "Coding", "Problem Solving"],
        "skills": ["Programming", "Logical Thinking"],
        "subjects": ["Computer Science", "Mathematics"],
        "work_styles": ["Independent Deep Work"],
        "top_k": 3
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["recommendations"]) == 3
    assert data["recommendations"][0]["career_id"]
    assert data["recommendations"][0]["match_score"] >= data["recommendations"][1]["match_score"]
    assert "explanation" in data["recommendations"][0]


def test_saved_profile_and_history():
    created = client.post("/api/v1/profiles", json={
        "full_name": "Demo Student",
        "interests": ["Data & Patterns"],
        "skills": ["Statistics", "Data Visualization"],
        "subjects": ["Mathematics", "Statistics"]
    })
    assert created.status_code == 201
    profile_id = created.json()["profile_id"]

    rec = client.post(f"/api/v1/profiles/{profile_id}/recommendations", json={"top_k": 2})
    assert rec.status_code == 200
    assert len(rec.json()["recommendations"]) == 2

    history = client.get(f"/api/v1/profiles/{profile_id}/history")
    assert history.status_code == 200
    assert history.json()["count"] >= 1


def test_compare():
    response = client.post("/api/v1/compare", json={
        "career_ids": ["software-developer", "data-analyst"]
    })
    assert response.status_code == 200
    assert len(response.json()["careers"]) == 2


def test_frontend_is_served_from_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "CareerCompass AI" in response.text
    assert "/frontend/app.js" in response.text


def test_frontend_javascript_is_served():
    response = client.get("/frontend/app.js")
    assert response.status_code == 200
    assert "api/v1/recommendations" in response.text
