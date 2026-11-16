# Agent-managed workmux integration workflow (v3)

Use one worktree as the integration environment and the only place running the server and Next.js app. Its checked-out feature branch is the integration branch. Task agents work in separate branches and worktrees; the integration agent reviews and combines their work locally before the integration branch is published as a PR to `main`.

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

The integration agent may inspect source, implement changes, review diffs, and run checks itself. This differs from the upstream coordinator's dispatcher-only role. Use workmux for delegated task sessions; do not substitute in-process subagents for the separate worktrees requested here. Task agents should implement their assignment directly rather than recursively dispatching more agents unless explicitly requested.

This document is the workflow source of truth. The skill reads it instead of maintaining a second copy. If skill discovery has not refreshed, instruct the agent to read `.agents/skills/workmux-integration/SKILL.md` directly.

## Local handoff state

Maintain one small handoff file at `.workmux-local/integration.md` in the **integration worktree**. This may be the original checkout or a separate feature worktree; the role determines the location. Task worktrees do not maintain copies. The directory is ignored by the repository's `.gitignore`, so it stays local and is not included in commits, new worktrees, or PRs. Store dispatch prompts under `.workmux-local/prompts/` in that same integration worktree and pass their absolute paths to workmux; use repository-relative paths inside the prompts.

Create the handoff when beginning an integration assignment and update it after dispatch, review, merge, validation, and cleanup. Record only current operational context:

- Feature goal and acceptance criteria.
- Integration worktree path, branch, current commit, and intended project session.
- Task handles, branches, worktree paths, dispatch base commits, prompt paths, and latest known status.
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

Begin with a clean working directory and synchronized local `main`, then create the integration branch:

```sh
git switch main
git pull --ff-only
git switch -c feat/my-new-feature
```

If `main` has diverged, inspect and resolve that history before proceeding. Keep feature commits on the integration branch rather than local `main`.

## Delegate through the integration agent

The user can request delegation directly:

> Fix the dashboard issue in a separate workmux worktree. Review and merge the result into this integration branch, then test it here.

This request authorizes the integration agent to create the task branch and worktree, write and deliver the task prompt, launch a task agent, review its committed work, merge it into the current integration branch, and run appropriate integration checks. The user does not need to create task branches, write prompt files, or run workmux commands manually. Pushes and PR creation require a user request, which may be given as part of the original task.

## Integration agent responsibilities

1. **Prepare a committed starting point.** Identify the branch checked out in the integration worktree and use it explicitly as the integration branch. Commit completed, relevant integration-agent edits before dispatching. Do not automatically commit unrelated user edits; clarify their handling when they affect the task. Uncommitted changes are not included in new task branches.

2. **Write a self-contained task brief.** Include the problem, expected behavior, relevant files and context, scope boundaries, acceptance criteria, and required local checks. Tell the task agent to commit its finished work and report its commit IDs, changes, checks, and remaining concerns. The integration agent owns merging and shared-service testing. Store the prompt outside tracked source, or in an ignored location, so it does not become an accidental product change.

3. **Dispatch the task.** Choose a unique task branch and create its worktree from the committed integration branch. Pass the prompt file to the new agent:

   ```sh
   workmux add <task-branch> --base <integration-branch> -b -P <prompt-file> --parent-session <project-session>
   ```

   For example, use `feat/my-new-feature-dashboard` as the task branch and `feat/my-new-feature` as its base. Independent tasks may run concurrently. Each branch starts from the integration branch's committed state at dispatch time; existing task branches do not automatically receive later integration changes. For dependent tasks, dispatch after the prerequisite is merged, or explicitly coordinate an update of the task branch.

   Use the intended project session from user instructions or known integration context. Include it with `--parent-session` when needed for placement; ask if placement is required but unknown rather than guessing. Confirm launch with `workmux wait <handle> --status working --timeout 30`, then inspect status/output if the agent has already finished or the wait times out.

   Track every dispatched handle in the handoff until reviewed, merged, and validated or explicitly canceled. Monitor with `workmux status`, `workmux capture`, and bounded `workmux wait` calls; use `--any` when multiple tasks remain. A canceled wait or intervening user message does not cancel tasks. Reconcile statuses and resume monitoring after handling the interruption, keeping the user informed. A `done` status means the session stopped working, not that its implementation has been accepted.

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

## Publish the combined feature

When requested, publish the validated integration branch and open one PR targeting `main`:

```sh
git push -u origin feat/my-new-feature
gh pr create --base main --head feat/my-new-feature
```

After the PR is merged on GitHub, return to local `main` and synchronize it:

```sh
git switch main
git pull --ff-only
```

A squash merge creates a new commit on `main` rather than preserving the task branches' commit identities. Keeping local `main` free of feature commits allows it to fast-forward normally after that merge. Start the next integration branch from this updated `main`.
