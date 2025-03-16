@echo off
cd /d %~dp0
call npm run parse:all
pause
