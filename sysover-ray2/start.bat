@echo off
setlocal

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
set "SYSOVERRAY_EXIT_CODE=%ERRORLEVEL%"

if not "%SYSOVERRAY_EXIT_CODE%"=="0" (
  echo.
  echo SysOverRay startup failed. Check the message above.
  pause
)
exit /b %SYSOVERRAY_EXIT_CODE%
