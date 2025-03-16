@echo on
cd /d %~dp0
call npm install

call npm run build
echo Skrypt zakończony pomyślnie.
pause
