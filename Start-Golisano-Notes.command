#!/bin/bash
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js is not installed. Get it from https://nodejs.org then run this again."; read -n1 -p "Press a key"; exit 1; }
[ -d node_modules ] || { echo "Installing, first run only..."; npm install; }
npm start
