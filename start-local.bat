@echo off
title Prachin Sampada - Local Runner
echo ========================================================
echo       STARTING HAMRO PRACHIN SAMPADA (LOCAL)
echo ========================================================
echo.

:: 1. Check if MySQL (XAMPP) is already running
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MySQL is already running.
) else (
    echo [*] Starting MySQL from XAMPP...
    if exist "C:\xampp\mysql_start.bat" (
        start "XAMPP MySQL Daemon" /MIN cmd /c "C:\xampp\mysql_start.bat"
    ) else (
        echo [!] Please make sure MySQL is started in your XAMPP Control Panel.
    )
    timeout /t 3 /nobreak >nul
)

:: 2. Start Backend API Server
echo [*] Starting Backend API Server (Port 5050)...
start "Sampada Backend (API 5050)" cmd /k "cd server && npm run dev"

:: 3. Wait 2 seconds for server to mount
timeout /t 2 /nobreak >nul

:: 4. Start Frontend Client
echo [*] Starting Frontend Client (Vite 5173/5174)...
start "Sampada Frontend (Vite)" cmd /k "cd client && npm run dev"

echo.
echo ========================================================
echo Backend is at:   http://localhost:5050
echo Frontend is at:  http://localhost:5173 (or 5174)
echo Database:        Local XAMPP MySQL (Port 3306)
echo ========================================================
echo.
pause
