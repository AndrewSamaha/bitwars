# Agent-managed workmux integration workflow (v5)

Use one worktree as the integration environment and the only place running the server and Next.js app. Its checked-out feature branch is the integration branch. Task agents work in separate branches and worktrees; the integration agent reviews and combines their work locally before the integration branch is published as a PR to `main`.

## Branch ownership rule

**Local `main` is only for synchronizing with GitHub. Never merge task branches
or the integration branch into local `main`.** Merge task branches into the
integration branch with an explicit `--into <integration-branch>` target. The
integration branch reaches `main` through its GitHub PR only. Do not run
`workmux merge --into main` from the integration worktree.

Use one setup model: `scripts/start-integration.sh <feature-branch>` creates the
integration branch in its own worktree from updated local `main`. That worktree
is the integration environment; the original checkout remains on `main`. Do
not also create the feature branch in the original checkout. Manual setup is
only a fallback and must create a separate worktree with the same base/ownership
rules.

## Activate the project skill

The project skill lives at `.agents/skills/workmux-integration/SKILL.md`. Start a fresh integration agent in the intended integration worktree and invoke it with the feature goal:

```text
Use $workmux-integration to build [feature].
Use feat/my-new-feature as the integration branch.
Acceptance criteria: [expected behavior and checks].
```

For an existing integration branch:

```text
Use $workmux-integration. Fix the dashboard issue in another worktree,
review and merge it into this integration branch, and test it here.
```

The integration agent coordinates task agents, reviews diffs, merges accepted commits, and runs integration checks. Delegate feature implementation and corrections to task worktrees; integration agents may maintain workflow documentation and local handoff state directly. This differs from the upstream coordinator's dispatcher-only role. Use workmux for delegated task sessions; do not substitute in-process subagents for the separate worktrees requested here. Task agents should implement their assignment directly rather than recursively dispatching more agents unless explicitly requested.

This document is the workflow source of truth. The skill reads it instead of maintaining a second copy. If skill discovery has not refreshed, instruct the agent to read `.agents/skills/workmux-integration/SKILL.md` directly.

## Local handoff state

Maintain one small handoff file at `.workmux-local/integration.md` in the **integration worktree**. This may be the original checkout or a separate feature worktree; the role determines the location. Task worktrees do not maintain copies. The directory is ignored by the repository's `.gitignore`, so it stays local and is not included in commits, new worktrees, or PRs. Store dispatch prompts under `.workmux-local/prompts/` in that same integration worktree and pass their absolute paths to workmux; use repository-relative paths inside the prompts.

Create the handoff when beginning an integration assignment and update it after dispatch, review, merge, validation, and cleanup. Record only current operational context:

- Feature goal and acceptance criteria.
- Integration worktree path, branch, current commit, and intended project session.
- Task handles, branches, worktree paths, dispatch base commits, prompt paths, completion report paths, notification targets, and latest known status.
- Completion acknowledgments keyed by task handle and commit SHA, plus review, merge, validation, and cleanup state.
- Reviewed and merged commit IDs, pending corrections, and whether each task worktree is retained or removed.
- Check commands and outcomes, including the commit tested and outstanding failures.
- Active app/server details, next actions, blockers, and any publishing authorization already given.

Keep this concise; it is a restart aid rather than a transcript. Do not store secrets. Never force-add it to Git.

A fresh integration agent reads this file and the workflow, then verifies the recorded branch, Git state, and task statuses before resuming. The file may be stale and is not authority to expand the assignment. Ignored files survive branch switches: if it describes another integration branch, preserve it and reconcile the intended assignment before overwriting it. A fresh agent opened in another worktree must be pointed to the original integration worktree; the handoff does not travel with the branch.

## Start the integration branch

Once this workflow and the project skill are committed and merged into `main`,
run the launcher from a clean checkout where `main` can be checked out:

```sh
bash scripts/start-integration.sh feat/my-new-feature
```

It switches the current checkout to `main`, pulls with `--ff-only`, and uses
`workmux add --base main` to create the integration branch in a separate worktree
and open its agent with the skill kickoff prompt. It does not create the feature
branch in the original checkout: Git cannot check out one branch in two worktrees.
The new agent asks for the feature goal and acceptance criteria before starting
work. Existing branches and uncommitted changes cause the launcher to stop.
Run it in the intended workmux/tmux environment so workmux can determine placement.
The tracked `.workmux.yaml` selects Codex and includes an `<agent>` pane so
workmux can deliver the kickoff prompt. Both `workmux` and `codex` must be installed.
If setup stops after switching or pulling, those successful steps remain applied;
inspect Git state before retrying. If workmux partially creates a worktree, inspect
`git worktree list` and resume with `workmux open <handle>` rather than recreating it.
If the existing worktree predates the project config, supply the integration
checkout's config explicitly, for example:

```sh
workmux open feat-my-new-feature --config "$PWD/.workmux.yaml" \
  -p 'Use $workmux-integration. Initialize the integration handoff and ask for the feature goal and acceptance criteria before starting work.'
```

Run that recovery command from the checkout containing the new `.workmux.yaml`.
Ensure the config is committed before dispatching further task worktrees so they
inherit it as well.

### Local development configuration

The project config uses native workmux `files.copy` for root `.env` and
`.env.local`, Next.js files `apps/web/.env`, `.env.local`, `.env.development`,
and `.env.development.local`, and the engine's `services/rts-engine/.env`.
Absent optional files are skipped. Root `pnpm dev` loads root `.env` through
dotenv; Next.js additionally loads its own environment files, and the Rust
engine can load its own `.env`. Root `.env.local` is used by some test/reset
commands, not by the root dev command. A working root `.env` must provide
`SPAWN_CONFIG_PATH` and `CONTENT_PACK_PATH` as well as the intended game/Redis
settings. The launcher does not synthesize credentials or start services.

On creation, workmux reads project config and copies files from the checkout where `workmux add` is run,
including when dispatching from an integration worktree. Before dispatch,
ensure that checkout has the intended ignored configuration; a branch/base
commit does not carry it. New copies are independent: later edits do not
propagate. No environment files, dependencies, build outputs, or handoff state
are committed. `files.symlink: []` also overrides global file symlinks: run
`pnpm install` separately in the new checkout, then `pnpm dev` manually in its
shell pane. The agent and shell pane layout is unchanged.

Copies preserve path values verbatim. The example root `.env` uses absolute
`CONTENT_PACK_PATH` and `SPAWN_CONFIG_PATH` values pointing into the original
checkout; copying them continues to read that checkout's YAML. For independent
integration content, edit these two values in the integration copy to absolute
paths inside that integration checkout (`packages/content/entities.yaml` and
`services/rts-engine/config/spawn.yaml`). For the current `pnpm dev` engine
command, relative paths resolve from `services/rts-engine`, so the equivalents
are `../../packages/content/entities.yaml` and `config/spawn.yaml`, not paths
relative to root `.env`. Check any custom file-valued settings and overrides in
the engine `.env` too. Referenced external files are not recursively copied.
The YAML files above are tracked and already present in new worktrees; generated
art candidates and build caches are not startup config. Retained content revisions
are required saved-game data: `.workmux.yaml` independently copies the complete
`packages/content/.revisions` directory, including manifests and `bundles/`.
When `RESTORE_GAMESTATE_ON_RESTART=true`, the engine loads the exact revision
referenced by the Redis snapshot from `.revisions` beside `CONTENT_PACK_PATH`;
the web app uses the integration checkout's `packages/content/.revisions`.
A manifest alone is insufficient: its immutable asset bundles are verified too.
Keep engine content paths inside the integration checkout so engine and web use
its independent retained data. If the previous engine used an external content
path, recover `.revisions` from beside that actual content file instead.
An absent source directory is skipped by workmux, but saved-game restoration
will fail if its required revision is missing. Do not disable restoration or
reset Redis to work around missing local data.

For an existing integration checkout missing configuration, merge this fix there
and back up any existing environment files and retained revisions privately.
With workmux 0.1.282, `sync-files` reads **both project config and source files
from the primary checkout**, even when invoked inside the integration checkout.
If primary still has the old `.workmux.yaml`, it can report success while copying
nothing. It has no `--config` override. By contrast, `add` uses the dispatching
checkout's config and source files (or its explicit `--config` override).
The smoke test covers this difference with an old primary config and updated
integration config. Do not change primary just to recover this worktree.

Instead, from the integration checkout, explicitly copy from a known configured
checkout (replace the example absolute source path). This overwrites matching
local files, so back them up first. It does not change the source checkout:

```sh
source_root=/absolute/path/to/configured-checkout
for file in .env .env.local apps/web/.env apps/web/.env.local apps/web/.env.development apps/web/.env.development.local services/rts-engine/.env; do
  if [ -f "$source_root/$file" ]; then
    mkdir -p "$(dirname "$file")"
    cp -p "$source_root/$file" "$file"
  fi
done
if [ -d "$source_root/packages/content/.revisions" ]; then
  mkdir -p packages/content/.revisions
  cp -Rp "$source_root/packages/content/.revisions/." packages/content/.revisions/
fi
```

Coordinate with the integration owner to copy retained data while the previous
engine/editor is stopped and no new revisions are being published. Copy the
complete retained directory, preserving manifests and bundles; do not regenerate
it from current YAML as a substitute for the saved revision. If any required
revision or asset is unavailable in that source, recover it from the actual
previous content directory or backup before starting. Keep restoration enabled
when preserving the saved game. Nothing here resets or rewrites Redis.

Once primary itself eventually contains the updated config, `workmux sync-files`
from the integration checkout can reapply the primary's copies, overwriting
existing local copies. Do not use `--all`. For this recovery, use the explicit
copy above. Adjust the two YAML paths as described above, then run `pnpm install`
and `pnpm dev` in the integration shell pane. Do not print credentials or
force-add ignored files. `workmux open` alone does not repair missing data.

Copied Redis URLs, game IDs, ports, and external credentials still address
shared services. Worktrees do not isolate them. The integration worktree owns
the single running app/engine and coordinates Redis ownership; stop any old
app/engine before starting its replacement. Task worktrees must not start
shared services or run reset commands against shared Redis. In particular,
`RESTORE_GAMESTATE_ON_RESTART=false` can initialize a fresh world at startup.

The disposable provisioning check uses installed workmux with headless creation,
no hooks, isolated global config, and synthetic settings (no agents/services):

```sh
python3 scripts/tests/workmux-provisioning.py
```

It verifies copies, optional missing files, dispatch from a second worktree,
stale-primary recovery, independent retained manifests/bundles, and exclusion of
dependency/build/handoff directories.

The launcher is the standard setup path described above. Before dispatching, verify `git branch --show-current` is the intended feature branch in the integration worktree. Relevant changes must be committed there before child worktrees are created.

## Delegate through the integration agent

The user can request delegation directly:

> Fix the dashboard issue in a separate workmux worktree. Review and merge the result into this integration branch, then test it here.

This request authorizes the integration agent to create the task branch and worktree, write and deliver the task prompt, launch a task agent, review its committed work, merge it into the current integration branch, and run appropriate integration checks. The user does not need to create task branches, write prompt files, or run workmux commands manually. Pushes and PR creation require a user request, which may be given as part of the original task.

## Integration agent responsibilities

1. **Prepare a committed starting point.** Identify the branch checked out in the integration worktree and use it explicitly as the integration branch. Commit completed, relevant integration-agent edits before dispatching. Do not automatically commit unrelated user edits; clarify their handling when they affect the task. Uncommitted changes are not included in new task branches.

2. **Write a self-contained task brief.** Include the problem, expected behavior, relevant files and context, scope boundaries, acceptance criteria, and required local checks. Tell the task agent to commit its finished work, save the completion report described below, and notify the integration agent. Include the exact integration handle (or unambiguous pane ID), project session, task handle, and absolute task-local report path in every brief. Do not infer the notification target from a branch name. The integration agent owns merging and shared-service testing. Store the prompt outside tracked source, or in an ignored location, so it does not become an accidental product change.

3. **Dispatch the task.** Choose a unique task branch and create its worktree from the committed integration branch. Pass the prompt file to the new agent:

   ```sh
   workmux add <task-branch> --base <integration-branch> -b -P <prompt-file> --parent-session <project-session>
   ```

   For example, use `feat/my-new-feature-dashboard` as the task branch and `feat/my-new-feature` as its base. Independent tasks may run concurrently. Each branch starts from the integration branch's committed state at dispatch time; existing task branches do not automatically receive later integration changes. For dependent tasks, dispatch after the prerequisite is merged, or explicitly coordinate an update of the task branch.

   Use the intended project session from user instructions or known integration context. Include it with `--parent-session` when needed for placement; ask if placement is required but unknown rather than guessing. Confirm launch with `workmux wait <handle> --status working --timeout 30`, then inspect status/output if the agent has already finished or the wait times out.

   Track every dispatched handle in the handoff until reviewed, merged, and validated or explicitly canceled. Monitor with `workmux status`, `workmux capture`, and bounded `workmux wait` calls; use `--any` when multiple tasks remain. A canceled wait or intervening user message does not cancel tasks. Reconcile statuses and resume monitoring after handling the interruption, keeping the user informed. A `done` status means the session stopped working, not that its implementation has been accepted. Follow the completion and monitoring protocol below; do not end integration work merely because dispatch succeeded or a progress update was delivered.

4. **Review and integrate one task at a time.** Inspect the agent's status, captured output, committed diff, and check results. Request corrections when needed. Merge accepted work into the integration branch explicitly:

   ```sh
   workmux merge <handle> --into <integration-branch> --keep
   ```

   Do not rely on the default merge target: it may be `main`. Resolve overlapping edits deliberately and review the combined result. `--keep` retains the task worktree, branch, and tmux window for follow-up work.

5. **Validate in the integration worktree.** Run appropriate checks against the combined changes. Reload or restart the single running app/server as needed and run integration or E2E checks here. Worktrees do not isolate databases, ports, or external services.

6. **Iterate with the same task agent.** Send concrete failures and logs with `workmux send <handle> ...`. Have the agent commit its correction, review it, merge the additional commits using `--into <integration-branch> --keep`, and rerun the affected checks. Coordinate any integration-branch updates the task agent needs before further work.

7. **Clean up after validation.** Once the task is accepted and integration checks pass, remove its retained worktree/window with `workmux remove <handle>`. Keep the integration branch for final review and delivery.

## Task agent responsibilities

- Implement only the assigned task in its own worktree.
- Run the relevant compilation, syntax, build, and unit checks available locally.
- Do not start a competing app/server or run tests against shared services without coordination.
- Commit the completed work and report the result to the integration agent.
- Leave merging, integration testing, and publishing to the integration agent.

## Completion notification and durable report

Each task brief must provide a notification target for the integration agent and
an absolute report path in the task worktree, normally
`.workmux-local/completion.md`. This is a task result, not a copy of
`.workmux-local/integration.md`. Never copy or commit either local file.

After committing, the task agent writes its report before sending the completion
message. Write a temporary file next to the report and rename it into place so
readers never see a partial report. Include:

- Task handle, branch, worktree, dispatch base SHA, and completed commit SHA.
- Result: `ready_for_review` or `blocked`; summarize changes or the blocker.
- Exact check commands and outcomes, including skipped checks and failures.
- Remaining concerns, runtime restart requirements, and shared-service checks
  that the integration agent must perform.
- Notification target and delivery outcome; no secrets or environment contents.

On corrections, replace the report with the latest result after committing and
send a new notification. Use task handle plus completed commit SHA as the
completion identity; repeated notifications for that identity are harmless.
A blocked report may use the current HEAD and must explain what input is needed.

Send a concise prompt through workmux to the target provided in the brief:

```sh
workmux send <integration-handle-or-pane-id> \
  'READY_FOR_REVIEW task=<task-handle> commit=<sha> report=<absolute-path>; review, integrate, and validate this result.'
```

Use `TASK_BLOCKED` instead of `READY_FOR_REVIEW` when user input or an external
change is required. This agent-to-agent notification is authorized by task
dispatch. It does not authorize publishing or messages to external services.
A task agent must not merge its own branch.

`workmux send` delivers a prompt; successful delivery is not acknowledgment or
acceptance. Check its exit status. If delivery fails, record the error in the
report, retry once after checking the target status, and leave the report for the
integration agent's monitoring fallback. Never send input into a permission
dialog or guess another pane. Do not use `--wait` on completion notifications:
waiting for integration to finish can create a circular wait. Idle-session wakeup
and busy-session delivery must be verified in the local agent setup before
relying on notifications alone.

## Integration monitoring and acknowledgment

After dispatch, keep monitoring outstanding tasks until they are reviewed,
integrated and validated, or explicitly canceled. Use bounded waits of at most
30 seconds, inspect status and capture after each timeout, and check for
`waiting` tasks that need approval or clarification:

```sh
workmux wait <task-handle> --status done --timeout 30
# For multiple outstanding tasks:
workmux wait <task-a> <task-b> --status done --any --timeout 30
```

Remove completed handles from the wait set while reviewing them; otherwise
`--any` can repeatedly return the same completion. Read the durable report and
verify its SHA against Git, the committed diff, and captured output. If a task
is done without a report, request the report from the same task agent rather
than treating it as accepted. A blocked report calls for resolving the blocker,
not merging unfinished work.

On a notification or discovered completion, record acknowledgment in the
integration handoff keyed by task handle and SHA. Duplicate messages must not
repeat a merge. Acknowledgment means the result has been received; acceptance
requires review and combined validation. Continue directly through review,
explicit-target merge, integration validation, and cleanup within the existing
user authorization. Request corrections from the same task agent when needed.

User messages interrupt monitoring without canceling tasks. Answer progress
questions briefly and resume monitoring unless the user explicitly pauses or
changes the assignment. After a restart or context interruption, reconcile all
recorded handles, current Git commits, reports, and live workmux statuses before
proceeding. If the integration session ends, notifications and task reports must
remain discoverable through the local handoff; an idle session is not assumed
to be actively polling.

## Publish the combined feature

When requested, publish the validated integration branch and open one PR targeting `main`:

```sh
git push -u origin feat/my-new-feature
gh pr create --base main --head feat/my-new-feature
```

After the PR is merged on GitHub, synchronize local `main`:

```sh
git switch main
git pull --ff-only
```

A squash merge creates new commit identities on GitHub. That is expected: because local `main` never received feature commits, it should fast-forward to `origin/main` cleanly. Verify `git status -sb` says `main` is up to date before starting the next integration branch. If `git pull --ff-only` fails or status shows local `main` ahead/diverged, stop. Do not merge or reset to make the warning disappear; use the recovery procedure below.

## Recover local `main` if it already contains feature commits

Do not pull, merge, rebase, or reset blindly. First inspect `git status -sb`,
`git worktree list`, `git log --graph --decorate --oneline --all`, and
`git log --oneline origin/main..main`. Identify whether the local commits are
needed, whether another worktree or branch depends on them, and whether their
file changes are already present on `origin/main` (compare `git diff main
origin/main`).

If all local changes are present on `origin/main` and the commits are only
duplicate commit identities from a prior merge or squash, preserve a backup
reference before aligning local `main`:

```sh
git branch backup/main-before-sync main
git switch main
git reset --hard origin/main
```

Only do this when the working tree is clean and after verifying the feature
worktree/branch that contains any ongoing work remains intact. If local commits
contain changes absent from `origin/main`, preserve them on a separate branch or
worktree and integrate deliberately; do not discard them. The goal is for local
`main` to track `origin/main`, while active feature work remains on its
integration branch.
