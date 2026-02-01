#!/usr/bin/env bash
# Schema / contract check: regenerate TS and Rust from .proto and fail if
# generated files differ from what is committed (M0.1 deliverable 8).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "Schema check: regenerating from .proto..."

# Regenerate TS (buf generate)
pnpm --filter @bitwars/schemas run gen:ts

# Regenerate Rust (build.rs writes to services/rts-engine/src/pb)
cargo build -p rts-engine --quiet

# Fail if generated files changed
GENERATED_PATHS="packages/shared/src/gen services/rts-engine/src/pb"
if ! git diff --exit-code -- $GENERATED_PATHS; then
  echo ""
  echo "Schema check failed: generated files are out of sync with .proto."
  echo "  Run: pnpm --filter @bitwars/schemas run gen:ts"
  echo "  Run: cargo build -p rts-engine"
  echo "  Then commit the updated files under: $GENERATED_PATHS"
  exit 1
fi

echo "Schema check passed: generated code is in sync."
