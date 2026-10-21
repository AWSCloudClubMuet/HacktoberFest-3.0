#!/usr/bin/env sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
mkdir -p out
javac --release 17 -encoding UTF-8 -d out src/TuneWave_music_player/*.java
exec java -cp out TuneWave_music_player.Main "$@"
