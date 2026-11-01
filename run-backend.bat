@echo off
setlocal
echo ==========================================================
echo  ResQ-Allocate - Spring Boot Backend Launcher (Batch Entry)
echo ==========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-backend.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Backend service exited with code %ERRORLEVEL%.
    pause
)
