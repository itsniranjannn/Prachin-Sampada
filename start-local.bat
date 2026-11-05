@echo off
title Prachin Sampada - Local Runner
echo ========================================================
echo       STARTING HAMRO PRACHIN SAMPADA (LOCAL)
echo ========================================================
echo.

:: 1. Start Server in a separate window
echo Starting Backend API Server (Port 5050)...
start "Sampada Backend (API 5050)" cmd /k "cd server && npm run dev"

:: 2. Wait 2 seconds
timeout /t 2 /nobreak >nul

:: 3. Start Client in a separate window
echo Starting Frontend Client (Vite 5174/5173)...
start "Sampada Frontend (Vite)" cmd /k "cd client && npm run dev"

echo.
echo ========================================================
echo Backend will be at:  http://localhost:5050
echo Frontend will be at: http://localhost:5173 (or 5174)
echo MySQL (XAMPP):       Running on port 3306
echo ========================================================
echo.
pause
