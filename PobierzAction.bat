@echo off
cd /d %~dp0
call npm run fetch:action
pause
