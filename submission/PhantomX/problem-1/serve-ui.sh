#!/usr/bin/env sh
set -e
root="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
static="$root/src/main/resources/static"
cd "$static"

if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/jwebserver" ]; then
  echo "TuneWave UI: http://127.0.0.1:8080/"
  "$JAVA_HOME/bin/jwebserver" -b 127.0.0.1 -p 8080 -d "$static"
elif command -v python3 >/dev/null 2>&1; then
  echo "TuneWave UI: http://127.0.0.1:8080/"
  python3 -m http.server 8080 --bind 127.0.0.1
else
  echo "Need jwebserver (JDK 18+) or python3 to serve the UI." >&2
  exit 1
fi
