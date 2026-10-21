@echo off
if not exist bin\tunewave\demo\TuneWaveDemo.class (
    echo Binaries not found. Building first...
    call build.bat
)
echo Starting TuneWave Music Player...
java -cp bin tunewave.demo.TuneWaveDemo %*
