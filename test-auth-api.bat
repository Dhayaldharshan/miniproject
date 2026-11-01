@echo off
setlocal
echo ==========================================================
echo  ResQ-Allocate - Automated Authentication API Test Suite
echo ==========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0test-auth-api.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo One or more tests failed or backend was unreachable.
)
pause
