#!/usr/bin/env sh
set -e
root="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$root"
sh "$root/mvnw" test
