# Agent-managed workmux integration workflow

Use one worktree as the integration environment and the only place running the server and Next.js app. Its checked-out feature branch is the integration branch. Task agents work in separate branches and worktrees; the integration agent reviews and combines their work locally before the integration branch is published as a PR to `main`.

## Start the integration branch

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
