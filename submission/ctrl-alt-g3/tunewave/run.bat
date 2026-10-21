@echo off
setlocal
cd /d "%~dp0"
if not exist out mkdir out
javac --release 17 -encoding UTF-8 -d out src\TuneWave_music_player\*.java
if errorlevel 1 exit /b 1
java -cp out TuneWave_music_player.Main %*
exit /b %errorlevel%
