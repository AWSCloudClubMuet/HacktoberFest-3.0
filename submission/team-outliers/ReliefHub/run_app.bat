@echo off
TITLE ReliefHub Launcher
echo ===================================================
echo ReliefHub -- Flood Relief Coordination Dashboard
echo AWS Cloud Club MUET HacktoberFest 3.0
echo ===================================================
echo.
echo Starting ReliefHub Mock REST API Server on port 5000...
start "ReliefHub Mock API (Port 5000)" cmd /k "python api/server_runner.py"

echo.
echo Waiting 2 seconds for API to initialize...
timeout /t 2 /nobreak >nul

echo Starting ReliefHub Streamlit Dashboard...
python -m streamlit run app.py

pause
