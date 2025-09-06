#!/usr/bin/env bash
set -euo pipefail

rm -rf node_modules .turbo
find . -name node_modules -type d -prune -exec rm -rf '{}' +
find . -name dist         -type d -prune -exec rm -rf '{}' +
find . -name .next        -type d -prune -exec rm -rf '{}' +
find . -name build        -type d -prune -exec rm -rf '{}' +
find . -name "*.tsbuildinfo" -delete

# generated protobuf TS
rm -rf packages/shared/src/gen

# optional: uncomment for truly cold installs
# rm -f pnpm-lock.yaml
# pnpm store prune

echo "Clean complete."
