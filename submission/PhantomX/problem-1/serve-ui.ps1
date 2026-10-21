$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$static = Join-Path $root "src\main\resources\static"
Set-Location $static

$javaHome = $env:JAVA_HOME
if (-not $javaHome) {
    $jdk = Get-ChildItem "C:\Program Files\Microsoft\jdk-*" -Directory -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending |
        Select-Object -First 1
    if ($jdk) { $javaHome = $jdk.FullName }
}

$port = 8080
if ($javaHome -and (Test-Path (Join-Path $javaHome "bin\jwebserver.exe"))) {
    Write-Host "TuneWave UI: http://127.0.0.1:$port/"
    & (Join-Path $javaHome "bin\jwebserver.exe") -b 127.0.0.1 -p $port -d $static
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "TuneWave UI: http://127.0.0.1:$port/"
    python -m http.server $port --bind 127.0.0.1
} else {
    Write-Error "Need jwebserver (JDK 18+) or python to serve the UI."
}
