#!/usr/bin/env bash
set -euo pipefail

# Kill dev servers owned by this repo in a safe, best-effort way.
# Usage: scripts/kill-dev-servers.sh [--force] [--port PORT]
#  --force  - skip graceful TERM and go straight to KILL
#  --port   - also kill process listening on this TCP port (default: 5173)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=5173
FORCE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE=1; shift ;;
    --port) PORT="$2"; shift 2 ;;
    -p) PORT="$2"; shift 2 ;;
    -f) FORCE=1; shift ;;
    *) echo "Unknown arg: $1"; exit 2 ;;
  esac
done

echo "Stopping dev servers for repo: $ROOT_DIR"

# Helper to list relevant processes
list_procs() {
  # Look for node/vite/esbuild/npm processes whose command path contains the workspace
  ps aux | grep -E 'vite|node|npm' | grep "$ROOT_DIR" | grep -v grep || true
}

PIDS=$(ps aux | grep -E 'vite|node|npm' | grep "$ROOT_DIR" | grep -v grep | awk '{print $2}' | tr '\n' ' ' || true)

if [ -z "$PIDS" ]; then
  echo "No matching vite/node/npm processes found under $ROOT_DIR"
else
  echo "Found PIDs to stop:" $PIDS
  if [ "$FORCE" -eq 1 ]; then
    echo "Force-killing..."
    echo $PIDS | xargs -r kill -9 || true
  else
    echo "Sending TERM (graceful) first..."
    echo $PIDS | xargs -r kill -TERM || true
    sleep 1
    # re-check
    STILL=$(ps aux | grep -E 'vite|node|npm' | grep "$ROOT_DIR" | grep -v grep | awk '{print $2}' | tr '\n' ' ' || true)
    if [ -n "$STILL" ]; then
      echo "Some processes remained after TERM: $STILL"
      echo "Sending KILL to remaining processes..."
      echo $STILL | xargs -r kill -9 || true
    fi
  fi
fi

# Port-based cleanup (vite default port)
if command -v lsof >/dev/null 2>&1; then
  PORT_PID=$(lsof -iTCP:$PORT -sTCP:LISTEN -t || true)
  if [ -n "$PORT_PID" ]; then
    echo "Found process listening on port $PORT: $PORT_PID"
    if [ "$FORCE" -eq 1 ]; then
      echo $PORT_PID | xargs -r kill -9 || true
    else
      echo $PORT_PID | xargs -r kill -TERM || true
      sleep 1
      STILL_PORT=$(lsof -iTCP:$PORT -sTCP:LISTEN -t || true)
      if [ -n "$STILL_PORT" ]; then
        echo "Forcing port process kill: $STILL_PORT"
        echo $STILL_PORT | xargs -r kill -9 || true
      fi
    fi
  else
    echo "No process listening on port $PORT"
  fi
else
  echo "lsof not available — skipping port cleanup"
fi

echo "Final check:"
list_procs
echo "Done."
