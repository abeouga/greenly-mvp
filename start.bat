@echo off
setlocal

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
set "KUSAKARI_CANVAS_EXIT_CODE=%ERRORLEVEL%"

echo.
echo Kusakari Canvas startup ended.
if not "%KUSAKARI_CANVAS_NO_PAUSE%"=="1" pause >nul
exit /b %KUSAKARI_CANVAS_EXIT_CODE%
