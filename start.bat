@echo off
setlocal

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
set "GREENLY_EXIT_CODE=%ERRORLEVEL%"

echo.
echo Greenly startup ended. Press any key to close this window.
pause >nul
exit /b %GREENLY_EXIT_CODE%
