# Schema Check (Script and CI)

## Overview

The **schema check** enforces that generated TypeScript and Rust code stays in sync with the `.proto` definitions (M0.1 deliverable 8). It runs locally via a pnpm script and in CI via a GitHub Action. Use it to catch forgotten regeneration and to enforce protocol-version and compatibility policy on proto changes.

## What it checks

1. **Generated code in sync**  
   After regenerating TS (buf) and Rust (prost) from `packages/schemas/proto/`, the check fails if any of these paths have uncommitted changes:
   - `packages/shared/src/gen/`
   - `services/rts-engine/src/pb/`

2. **Compat policy (CI only, on PRs)**  
   If any file under `packages/schemas/proto/*.proto` changed in the PR, the check fails unless **one** of:
   - The PR has the label **`compat: non-breaking`**, or  
   - **`ENGINE_PROTOCOL_MAJOR`** in `services/rts-engine/src/engine/mod.rs` was **increased** compared to the base branch.

## Running locally

**Via pnpm (recommended):**

```bash
pnpm schema:check
```

**What it does:**

1. Runs `pnpm --filter @bitwars/schemas run gen:ts` (buf generate → TS under `packages/shared/src/gen`).
2. Runs `cargo build -p rts-engine` (build.rs generates Rust under `services/rts-engine/src/pb`).
3. Runs `git diff --exit-code` on the generated paths; exits with code 1 if there are changes.

**Requirements:**

- Repo root as working directory.
- pnpm and Node (for buf/TS).
- Rust toolchain (for rts-engine).
- Git (to diff against the current index/working tree).

## When the check fails locally

**“Generated files are out of sync”:**

1. Regenerate and commit the updates:
   ```bash
   pnpm --filter @bitwars/schemas run gen:ts
   cargo build -p rts-engine
   git add packages/shared/src/gen services/rts-engine/src/pb
   git commit -m "chore: regenerate from .proto"
   ```
2. Or, if you changed `.proto` intentionally, run the same commands and commit the resulting changes.

**“Proto files changed without ENGINE_PROTOCOL_MAJOR bump” (CI only):**

- Add the label **`compat: non-breaking`** to the PR, or  
- Bump **`ENGINE_PROTOCOL_MAJOR`** in `services/rts-engine/src/engine/mod.rs` and ensure the PR includes that change.

## GitHub Action

**Workflow file:** `.github/workflows/schema-check.yml`

**Triggers:**

- `push` to `main`
- `pull_request` targeting `main`

**Steps:**

1. Checkout (full history for compat check).
2. Install pnpm 10, Node 20, Rust stable.
3. `pnpm install --frozen-lockfile`.
4. **Schema check:** `pnpm schema:check` (same as local).
5. **Compat check:** Only on `pull_request`; if any `.proto` file changed, require label or version bump as above.

**Required status check:**

To block merging when the check fails:

1. **Settings** → **Branches** → **Branch protection rules** for `main`.
2. Enable **“Require status checks to pass before merging”**.
3. Add the status check **`schema-check`** (job name).
4. Save.

## Script and workflow locations

| Item              | Path                                  |
|-------------------|----------------------------------------|
| Local script      | `scripts/schema-check.sh`              |
| pnpm script       | Root `package.json`: `schema:check`   |
| GitHub workflow   | `.github/workflows/schema-check.yml`   |
| Proto definitions | `packages/schemas/proto/`              |
| TS generated      | `packages/shared/src/gen/`             |
| Rust generated    | `services/rts-engine/src/pb/`          |
| Protocol constant | `services/rts-engine/src/engine/mod.rs`: `ENGINE_PROTOCOL_MAJOR` |

## See also

- [M0.1 Intent Lifecycle](../milestones/m0.1-intent-lifecycle.md) — deliverable 8 (Schema / contract CI guardrails).
- [Intent CLI](./intent-cli.md), [Latency Probe](./latency-probe.md), [Redis to Files](./redis-to-files.md) — other tool docs.
