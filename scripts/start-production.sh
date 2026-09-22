#!/usr/bin/env bash

set -euo pipefail

pnpm --filter bitwars start &
web_pid=$!

(
  cd services/rts-engine
  exec cargo run --release
) &
engine_pid=$!

cleanup() {
  kill "$web_pid" "$engine_pid" 2>/dev/null || true
  wait "$web_pid" "$engine_pid" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

# Bash 3.2 (the macOS system shell) lacks `wait -n`, so poll portably.  If
# either service exits, the EXIT trap shuts down the other one too.
while kill -0 "$web_pid" 2>/dev/null && kill -0 "$engine_pid" 2>/dev/null; do
  sleep 1
done

exit 1
