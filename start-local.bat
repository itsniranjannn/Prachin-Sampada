@echo off
title Prachin Sampada - Local Runner
echo ========================================================
echo       STARTING HAMRO PRACHIN SAMPADA (LOCAL)
echo ========================================================
echo.

:: 1. Ensure MySQL is running (checks XAMPP)
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MySQL is already running.
) else (
    echo [*] Starting MySQL from XAMPP...
    if exist "C:\xampp\mysql_start.bat" (
        start "XAMPP MySQL Daemon" /MIN cmd /c "C:\xampp\mysql_start.bat"
    ) else (
        echo [!] Please start MySQL from your XAMPP Control Panel.
    )
    timeout /t 3 /nobreak >nul
)

:: 2. Start Server
echo [*] Starting Backend API Server (Port 5050)...
start "Sampada Backend (API 5050)" cmd /k "cd server && npm run dev"

:: 3. Wait for backend to mount
timeout /t 2 /nobreak >nul

:: 4. Start Client
echo [*] Starting Frontend Client (Vite 5173/5174)...
start "Sampada Frontend (Vite)" cmd /k "cd client && npm run dev"

echo.
echo ========================================================
echo Backend will be at:  http://localhost:5050
echo Frontend will be at: http://localhost:5173 (or 5174)
echo Database (XAMPP):    Running on localhost:3306
echo ========================================================
echo.
pause
