#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
model="${FIREWORKS_NEMOTRON_MODEL:-nemotron-lightning-3p5-30b-a3b}"
catalog="$repo_root/scripts/codex-nemotron-model-catalog.json"
provider="${FIREWORKS_CODEX_PROVIDER:-fireworks-ai}"

common_args=(
  -C "$repo_root"
  --model "$model"
  -c "model_provider=\"$provider\""
  -c "model_catalog_json=\"$catalog\""
)

if (( $# == 0 )); then
  exec codex "${common_args[@]}"
fi

case "$1" in
  exec|review|resume|fork)
    command="$1"
    shift
    exec codex "$command" "${common_args[@]}" "$@"
    ;;
  *)
    exec codex "${common_args[@]}" "$@"
    ;;
esac
