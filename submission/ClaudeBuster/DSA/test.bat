@echo off
if not exist bin\tunewave\test\TuneWaveTest.class (
    echo Binaries not found. Building first...
    call build.bat
)
echo Running TuneWave Automated Test Suite...
java -cp bin tunewave.test.TuneWaveTest
