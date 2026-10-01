@echo off
setlocal

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
set "SYSOVERRAY_EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%SYSOVERRAY_EXIT_CODE%"=="0" echo SysOverRay setup failed. Check the message above.
if "%SYSOVERRAY_EXIT_CODE%"=="0" echo SysOverRay setup completed.
pause
exit /b %SYSOVERRAY_EXIT_CODE%
