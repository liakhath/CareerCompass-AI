@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo   CareerCompass AI - Local Web Application
echo ==============================================
echo.

where py >nul 2>nul
if %errorlevel%==0 (
  set "PY_CMD=py"
) else (
  set "PY_CMD=python"
)

if not exist ".venv\Scripts\python.exe" (
  echo [1/3] Creating Python virtual environment...
  %PY_CMD% -m venv .venv
  if errorlevel 1 goto failed
)

echo [2/3] Installing/checking dependencies...
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto failed

echo.
echo [3/3] Starting CareerCompass AI...
echo Open http://127.0.0.1:8000/ in your browser.
echo API documentation: http://127.0.0.1:8000/docs
echo Keep this window open while using the application.
echo Press Ctrl+C here to stop the server.
echo.
".venv\Scripts\python.exe" -m uvicorn app.main:app --reload

echo.
echo CareerCompass AI server stopped.
pause
exit /b 0

:failed
echo.
echo Setup failed. Check that Python 3.10+ is installed and try again.
pause
exit /b 1
