# Workmux integration workflow

Use one worktree as the integration environment and the only place running the server and Next.js app. Give each independent task its own workmux worktree and agent. The integration branch is the branch checked out in the integration worktree; do not assume it is `main`.

1. **Dispatch:** Make sure the starting point is committed on the integration branch. Write a self-contained task prompt with acceptance criteria and local checks. From this repository, create the agent worktree in the background:
   ```sh
   workmux add <task-branch> --base <integration-branch> -b -P <prompt-file> --parent-session <project-session>
   ```
   Uncommitted integration-worktree changes are not included in the new branch.
2. **Local checks:** Have the agent implement the task and run relevant compilation, syntax, build, and unit checks in its worktree. It should not start a competing app/server or run integration tests against shared services without coordination.
3. **Review and integrate:** Check agent status and captured output, review the changes and check results, and have the agent commit its work. Merge one agent at a time, targeting the integration branch explicitly:
   ```sh
   workmux merge <handle> --into <integration-branch> --keep
   ```
   `--keep` retains the agent's worktree, branch, and tmux window for corrections. Do not use the default merge target: it may be `main`.
4. **E2E here:** Reload or restart the one running app as needed; run integration/E2E checks in the integration worktree. Shared databases, ports, and external services are not isolated by git worktrees.
5. **Iterate:** Send concrete failures and logs to the same agent with `workmux send <handle> ...`. After it commits a fix, review and merge its new commits into the integration branch with `--into ... --keep`, then rerun the affected E2E scenario.
6. **Finish:** Once accepted, remove the retained agent worktree/window with `workmux remove <handle>`. Keep the integration branch for the normal final review and delivery process.
