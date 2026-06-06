@echo off
call "%~dp0scripts\sync-db\sync-db.bat"
exit /b %ERRORLEVEL%
