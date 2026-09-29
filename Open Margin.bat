@echo off
rem Double-click to open Margin in your browser. Close this window to stop it.
cd /d "%~dp0app"
if not exist node_modules (
  echo Installing for the first time...
  call npm install
)
call npm run dev -- --open
