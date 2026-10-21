@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is required. Install it from https://nodejs.org and run this again. & pause & exit /b)
if not exist node_modules call npm install
call npm start
