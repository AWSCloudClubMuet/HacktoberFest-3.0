#!/bin/sh
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js is required. Install it from https://nodejs.org"; exit 1; }
[ -d node_modules ] || npm install
npm start
