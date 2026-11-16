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
    (main / ".gitignore").write_text(".env*\nnode_modules/\ntarget/\n.workmux-local/\n")
    run(main, "git", "add", ".")
    run(main, "git", "-c", "user.name=Smoke", "-c", "user.email=smoke@example.invalid",
        "commit", "-m", "fixture")
    fixtures = [".env", "apps/web/.env.local", "services/rts-engine/.env"]
    for filename in fixtures:
        path = main / filename
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("PROVISIONING_FIXTURE=main\n")
        path.chmod(0o600)
    for directory in ["node_modules", "target", ".workmux-local"]:
        (main / directory).mkdir()
        (main / directory / "sentinel").write_text("must not copy")

    def add(cwd, name):
        run(cwd, "workmux", "add", name, "--headless", "--no-hooks", "--base", "main")
        lines = run(main, "git", "worktree", "list", "--porcelain").splitlines()
        for index, line in enumerate(lines):
            if line == f"branch refs/heads/{name}":
                return Path(lines[index - 2].removeprefix("worktree "))
        raise AssertionError("worktree not found")

    first = add(main, "first")
    (first / ".env").write_text("PROVISIONING_FIXTURE=first\n")
    second = add(first, "second")
    for checkout in [first, second]:
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
    (second / ".env").unlink()
    run(second, "workmux", "sync-files")
    assert (second / ".env").read_text() == (main / ".env").read_text()
    (second / ".env").write_text("PROVISIONING_FIXTURE=modified\n")
    run(second, "workmux", "sync-files")
    assert (second / ".env").read_text() == (main / ".env").read_text()
    assert not (second / ".env.local").exists()  # Optional absent files are skipped.
    print("PASS: copy isolation, dispatch source, optional files, recovery, ignored state")
