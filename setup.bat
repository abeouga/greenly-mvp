@echo off
setlocal

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1" %*
set "KUSAKARI_CANVAS_EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%KUSAKARI_CANVAS_EXIT_CODE%"=="0" echo Setup failed. Check the message above.
if "%KUSAKARI_CANVAS_EXIT_CODE%"=="0" echo Kusakari Canvas setup completed.
if not "%KUSAKARI_CANVAS_NO_PAUSE%"=="1" pause
exit /b %KUSAKARI_CANVAS_EXIT_CODE%
