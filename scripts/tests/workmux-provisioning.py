#!/usr/bin/env python3
"""Exercise installed workmux in a disposable repo; no agents or services."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile


CONFIG = Path(__file__).resolve().parents[2] / ".workmux.yaml"


def run(cwd, *args):
    result = subprocess.run(args, cwd=cwd, env=env, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"{args[0:2]} failed: {result.stderr}")
    return result.stdout


with tempfile.TemporaryDirectory(prefix="bitwars-provisioning-") as temporary:
    root = Path(temporary)
    # Isolate global config (including hooks, file operations and worktree paths).
    env = {**os.environ, "XDG_CONFIG_HOME": str(root / "config"),
           "XDG_STATE_HOME": str(root / "state"), "XDG_DATA_HOME": str(root / "data")}
    main = root / "repo"
    main.mkdir()
    run(main, "git", "init", "-b", "main")
    shutil.copyfile(CONFIG, main / ".workmux.yaml")
    (main / ".gitignore").write_text(".env*\nnode_modules/\ntarget/\n.workmux-local/\n.revisions/\n")
    run(main, "git", "add", ".")
    run(main, "git", "-c", "user.name=Smoke", "-c", "user.email=smoke@example.invalid",
        "commit", "-m", "fixture")
    fixtures = [".env", "apps/web/.env.local", "services/rts-engine/.env",
                "packages/content/.revisions/revision-fixture/manifest.json",
                "packages/content/.revisions/bundles/worker/hash-fixture/primary.png"]
    for filename in fixtures:
        path = main / filename
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("PROVISIONING_FIXTURE=main\n")
        path.chmod(0o600)
    for directory in ["node_modules", "target", ".workmux-local"]:
        (main / directory).mkdir()
        (main / directory / "sentinel").write_text("must not copy")

    def add(cwd, name, *options):
        run(cwd, "workmux", "add", name, "--headless", "--no-hooks", "--base", "main", *options)
        lines = run(main, "git", "worktree", "list", "--porcelain").splitlines()
        for index, line in enumerate(lines):
            if line == f"branch refs/heads/{name}":
                return Path(lines[index - 2].removeprefix("worktree "))
        raise AssertionError("worktree not found")

    first = add(main, "first")
    (first / ".env").write_text("PROVISIONING_FIXTURE=first\n")
    # Model the primary checkout still having the pre-fix project config.
    (main / ".workmux.yaml").write_text("agent: codex\npanes:\n  - command: <agent>\n")
    second = add(first, "second")
    for checkout in [first, second]:
        assert not (checkout / "packages/content/.revisions").is_symlink()
        for filename in fixtures:
            path = checkout / filename
            assert path.is_file() and not path.is_symlink(), filename
            assert path.stat().st_mode & 0o777 == 0o600, filename
        for directory in ["node_modules", "target", ".workmux-local"]:
            assert not (checkout / directory).exists(), directory
        assert not run(checkout, "git", "status", "--porcelain").strip()
    # Creation copies from the dispatching worktree, including its local overrides.
    assert (second / ".env").read_text() == (first / ".env").read_text()
    assert (main / ".env").read_text() != (first / ".env").read_text()
    retained = "packages/content/.revisions/revision-fixture/manifest.json"
    (second / retained).write_text("independent copy")
    assert (first / retained).read_text() == (main / retained).read_text()
    (second / ".env").unlink()
    run(second, "workmux", "sync-files")
    # sync-files uses the primary config too: old config silently does nothing.
    assert not (second / ".env").exists()
    # Recovery needs no primary edits: copy the allowlisted files explicitly.
    run(second, "bash", "-c", '''
source_root=$1
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
''', "recovery", str(main))
    assert (second / ".env").read_text() == (main / ".env").read_text()
    assert (second / retained).read_text() == (main / retained).read_text()
    for filename in fixtures:
        assert (second / filename).stat().st_mode & 0o777 == 0o600, filename
    assert (main / ".workmux.yaml").read_text().startswith("agent: codex\npanes:")
    # Once the primary config is updated, native sync works and overwrites copies.
    shutil.copyfile(CONFIG, main / ".workmux.yaml")
    (second / ".env").write_text("PROVISIONING_FIXTURE=modified\n")
    run(second, "workmux", "sync-files")
    assert (second / ".env").read_text() == (main / ".env").read_text()
    assert not (second / ".env.local").exists()  # Optional absent files are skipped.
    print("PASS: add config/source, stale-primary sync no-op, explicit recovery, native sync, copy isolation")
