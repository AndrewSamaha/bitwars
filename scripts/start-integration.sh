#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || "$1" == -* ]]; then
  echo "Usage: $0 <new-integration-branch>" >&2
  exit 2
fi

branch=$1
git check-ref-format --branch "$branch" >/dev/null
command -v workmux >/dev/null || { echo "workmux is required." >&2; exit 1; }
command -v codex >/dev/null || { echo "codex is required." >&2; exit 1; }
repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Commit or stash working-tree changes before starting integration." >&2
  exit 1
fi
if git show-ref --verify --quiet "refs/heads/$branch"; then
  echo "Branch already exists: $branch. Resume it with workmux open instead." >&2
  exit 1
fi

# main stays in this checkout; workmux creates the feature branch elsewhere.
git switch main
git pull --ff-only

if [[ ! -f .agents/skills/workmux-integration/SKILL.md || ! -f docs/workmux-workflow.v4.md || ! -f .workmux.yaml ]]; then
  echo "Updated main must contain the integration skill, v4 workflow, and .workmux.yaml first." >&2
  exit 1
fi

prompt_file=$(mktemp "${TMPDIR:-/tmp}/workmux-integration.XXXXXX")
trap 'rm -f "$prompt_file"' EXIT
cat > "$prompt_file" <<EOF
Use \$workmux-integration. Read .agents/skills/workmux-integration/SKILL.md
and docs/workmux-workflow.v4.md.

You are the integration agent in the newly created integration worktree.
Integration branch: $branch
The branch has already been created from updated local main; do not repeat setup.
Initialize .workmux-local/integration.md here. Ask the user for the feature goal
and acceptance criteria before implementing or dispatching tasks.
Keep the app/server in this integration worktree and coordinate shared services
before starting them. Do not push or create a PR until requested.
EOF

workmux add "$branch" --base main -P "$prompt_file"
