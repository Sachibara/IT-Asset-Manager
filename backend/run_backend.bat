@echo off
setlocal
cd /d "%~dp0\.."

where python >nul 2>&1
if errorlevel 1 (
  echo Python was not found in PATH.
  pause
  exit /b 1
)

python -m pip install -r backend\requirements.txt
if errorlevel 1 (
  echo Failed to install IT Asset Manager dependencies.
  pause
  exit /b 1
)

echo.
echo Starting IT Asset Manager...
echo Open http://127.0.0.1:8795
echo.
python backend\asset_api.py
pause
