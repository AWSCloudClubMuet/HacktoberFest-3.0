#!/usr/bin/env sh
set -e
root="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$root"
echo "TuneWave: http://127.0.0.1:8081/"
sh "$root/mvnw" -q spring-boot:run
