#!/bin/bash
set -euo pipefail

cd ~/app

# Kill any existing static server on port 3000
pkill -f "python3 -m http.server 3000" 2>/dev/null || true
sleep 1

# Start static file server on port 3000 in the background
nohup python3 -m http.server 3000 > /tmp/app.log 2>&1 &
SERVER_PID=$!

echo "Static file server started (PID: $SERVER_PID) on port 3000"
sleep 2

# Verify it started
if kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "Server is running"
else
  echo "ERROR: Server failed to start. Check /tmp/app.log"
  cat /tmp/app.log || true
  exit 1
fi
