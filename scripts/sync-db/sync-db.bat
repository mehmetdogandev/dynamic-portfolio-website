@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-db.ps1"
exit /b %ERRORLEVEL%
