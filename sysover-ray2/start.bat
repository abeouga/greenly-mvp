@echo off
setlocal

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
set "SYSOVERRAY_EXIT_CODE=%ERRORLEVEL%"

if "%SYSOVERRAY_EXIT_CODE%"=="0" goto startup_confirmed

echo.
echo SysOverRay startup was not confirmed. Check the message above.
pause
exit /b %SYSOVERRAY_EXIT_CODE%

:startup_confirmed
echo SysOverRay window visibility confirmed. Closing this command window.
exit /b 0
