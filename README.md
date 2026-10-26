# CareerCompass AI — Working Full-Stack Project

This project combines the exported Google Stitch frontend with the existing Python FastAPI backend. It is designed to run as one local web application, so the browser UI and API share the same origin.

## What's working

- Stitch overview/dashboard is served at `/`.
- Sidebar links open functioning assessment, recommendations, career catalogue, career detail, compare careers, and saved profile/history views.
- Assessment dropdown/chip choices are loaded from the backend metadata endpoint.
- The assessment submits student data to FastAPI and displays recommendations from the real TF-IDF + cosine similarity recommender.
- Every assessment saves a profile to SQLite and attaches the recommendation run to that saved profile.
- Career catalogue and career details use the live backend data, not duplicated mock data.
- Compare Careers uses `POST /api/v1/compare` and shows shared and distinct skills.
- Profile & History retrieves saved profile information and previous recommendation runs, can rerun recommendations, and supports confirmed profile deletion.
- Overview API health indicator and career catalogue count reflect the backend.
- Search in the top header opens the career catalogue filtered by the entered term.
- Original Stitch styling and lightweight scroll reveal behavior are retained.
- `/docs` continues to provide FastAPI's interactive API documentation.

## Run on Windows

1. Extract the ZIP.
2. Open the extracted `CareerCompass_AI_Working_Project` folder in VS Code.
3. **Easiest option:** double-click `start_windows.bat`. The script creates a virtual environment if needed, installs dependencies, and starts the app. Keep its terminal window open.

   Or, from Terminal → New Terminal in VS Code, run these commands separately:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

If PowerShell refuses to activate the virtual environment, open Command Prompt and use:

```bat
.venv\Scripts\activate.bat
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

4. Open **http://127.0.0.1:8000/** for the actual frontend.
5. Open **http://127.0.0.1:8000/docs** to inspect and test the API.

Keep the terminal open while using the website. The database is automatically created on first start in `app/data/careercompass.db`.

## Verify it

```powershell
python -m pytest -q
```

The test suite checks the recommendation API, career catalogue, saved profile/history, career comparison, and frontend serving.

## Main API routes

- `GET /api/v1/health`
- `GET /api/v1/metadata`
- `GET /api/v1/careers`
- `GET /api/v1/careers/{career_id}`
- `POST /api/v1/recommendations`
- `POST /api/v1/profiles`
- `GET /api/v1/profiles/{profile_id}`
- `DELETE /api/v1/profiles/{profile_id}`
- `POST /api/v1/profiles/{profile_id}/recommendations`
- `GET /api/v1/profiles/{profile_id}/history`
- `POST /api/v1/compare`

## Project structure

```text
CareerCompass_AI_Working_Project/
├── app/
│   ├── main.py
│   ├── schemas.py
│   ├── database.py
│   ├── recommender.py
│   └── data/careers.json
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── DESIGN.md
│   └── screen.png
├── tests/
├── requirements.txt
├── abstract.txt
└── README.md
```

## Important notes

- The match score is a relative similarity indicator, not a probability of career success.
- Academic score is collected for context but does not affect ranking.
- Profile persistence is local SQLite and this demonstration does not implement authentication. Do not deploy it publicly with real student data until access controls, consent, retention, and data protection are added.
- The local API does not need an external paid AI key.
- The UI uses Tailwind's browser CDN and some Google Fonts/illustrations from the Stitch export, so the first browser load needs internet access for those external assets. The local Python API and recommendation engine run locally.
