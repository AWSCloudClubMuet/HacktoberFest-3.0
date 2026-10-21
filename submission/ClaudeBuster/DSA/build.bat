@echo off
echo ===================================================
echo   Compiling TuneWave Music Player (Java)
echo ===================================================
if not exist bin mkdir bin
javac -encoding UTF-8 -d bin src\tunewave\model\*.java src\tunewave\datastructures\*.java src\tunewave\player\*.java src\tunewave\demo\*.java src\tunewave\test\*.java
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Build succeeded! Classes compiled into bin\
) else (
    echo [ERROR] Build failed with error code %ERRORLEVEL%
)
