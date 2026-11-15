@echo off
rem Double-click to open Margin (and Vex, the AI behind it) in your browser. Close the windows to stop them.
if exist "%~dp0..\nova\server.js" (
  echo Starting Vex...
  start "Vex server" /min cmd /c "cd /d %~dp0..\nova && node server.js"
) else (
  echo Vex was not found next to Margin, so the AI buttons will say it is not running.
)
cd /d "%~dp0app"
if not exist node_modules (
  echo Installing for the first time...
  call npm install
)
call npm run dev -- --open
