@echo off
setlocal

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
set "GREENLY_EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%GREENLY_EXIT_CODE%"=="0" echo Setup failed. Check the message above.
if "%GREENLY_EXIT_CODE%"=="0" echo Setup completed.
pause
exit /b %GREENLY_EXIT_CODE%
