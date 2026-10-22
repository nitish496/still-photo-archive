#!/bin/bash
cd "$(dirname "$0")"
if curl --silent --show-error --fail --max-time 2 http://127.0.0.1:5173/src/styles.css -o /dev/null 2>/dev/null; then
  open http://127.0.0.1:5173/
  exit 0
fi
if lsof -nP -iTCP:5173 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "An old or unresponsive preview is using port 5173. In its Terminal window, press Control+C, then double-click this file again."
  read -r
  exit 1
fi
if [ ! -x node_modules/.bin/vite ]; then
  echo "Installing project dependencies..."
  npm install || { echo "Dependency installation failed. Check your internet connection and try again."; read -r; exit 1; }
fi
npm run dev -- --open
