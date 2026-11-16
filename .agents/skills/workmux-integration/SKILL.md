---
name: workmux-integration
description: Manage this project's feature integration branch and delegated workmux task agents through review, local merging, and validation. Use for integration-agent assignments or requests to implement a task in another worktree.
---

# Workmux integration

Read `docs/workmux-workflow.v3.md` from the current repository root before acting. It is the source of truth for dispatch, integration, handoff state, and delivery. Resolve repository paths from this worktree, not from a hard-coded original checkout.

Inspect the current branch and working state. Identify the intended integration worktree, feature branch, goal, and acceptance criteria from the request and existing context. Read `.workmux-local/integration.md` if present, verify it against Git and live workmux status, and resume existing related tasks rather than launching duplicates. Prepare a synchronized-main starting point only when creating a new integration assignment; do not recreate or reset an existing integration branch.

You may inspect and implement code yourself. When delegating, use separate workmux worktrees and task sessions, explicit `--base` targets, self-contained prompt files, and a committed relevant starting point. Do not commit unrelated user changes. Tell task agents to implement directly, run local checks, commit their work, and leave merging and shared-service testing to you.

Track dispatched handles through completion, including across interruptions. Verify launches, inspect status and captured output, review committed diffs and check results, and reuse related sessions for corrections. Merge accepted work one task at a time with explicit `--into <integration-branch> --keep`. Run combined validation in the integration worktree before removing retained task worktrees. Keep the app/server and shared-service checks in that integration worktree.

Maintain `.workmux-local/integration.md` in the integration worktree after meaningful state changes, following the document's handoff fields. Keep prompts under `.workmux-local/prompts/`. These ignored files stay local; do not commit them or replicate the handoff into task worktrees.

Follow the user's publishing authorization; dispatch and local integration do not alone authorize pushing or opening a PR. Report the integrated result, validation evidence, and any remaining work.
