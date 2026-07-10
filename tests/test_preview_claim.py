#!/usr/bin/env python3
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path

HELPER = Path(__file__).resolve().parents[1] / "scripts" / "preview_claim.sh"


class PreviewClaimTest(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.upstream = self.root / "upstream.git"
        self.repo = self.root / "repo"
        self.worktree = self.root / "wt"
        self.state_dir = self.root / "state"

        subprocess.run(["git", "init", "-q", "--bare", str(self.upstream)], check=True)
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)
        subprocess.run(["git", "-C", str(self.repo), "config", "user.name", "Test"], check=True)
        subprocess.run(
            ["git", "-C", str(self.repo), "config", "user.email", "test@example.com"], check=True
        )
        (self.repo / "f.txt").write_text("hi\n", encoding="utf-8")
        subprocess.run(["git", "-C", str(self.repo), "add", "f.txt"], check=True)
        subprocess.run(["git", "-C", str(self.repo), "commit", "-q", "-m", "init"], check=True)
        subprocess.run(["git", "-C", str(self.repo), "branch", "-M", "main"], check=True)
        subprocess.run(
            ["git", "-C", str(self.repo), "remote", "add", "origin", str(self.upstream)], check=True
        )
        subprocess.run(["git", "-C", str(self.repo), "push", "-q", "origin", "main"], check=True)
        subprocess.run(
            ["git", "-C", str(self.repo), "worktree", "add", "-q", str(self.worktree), "--detach", "origin/main"],
            check=True,
        )

    def tearDown(self):
        self.tempdir.cleanup()

    def env(self, **overrides):
        e = os.environ.copy()
        e["VIZ_PREVIEW_WORKTREE"] = str(self.worktree)
        e["VIZ_PREVIEW_STATE_DIR"] = str(self.state_dir)
        e["VIZ_PREVIEW_BASE_REF"] = "origin/main"
        e["VIZ_PREVIEW_URL"] = "http://example.test/"
        e.update(overrides)
        return e

    def run_helper(self, *args, **env_overrides):
        return subprocess.run(
            [str(HELPER), *args],
            capture_output=True,
            text=True,
            env=self.env(**env_overrides),
        )

    def head_sha(self):
        return subprocess.run(
            ["git", "-C", str(self.worktree), "rev-parse", "HEAD"],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()

    def dirty_worktree(self):
        with open(self.worktree / "f.txt", "a", encoding="utf-8") as f:
            f.write("dirty\n")

    def test_relative_state_dir_is_rejected(self):
        r = self.run_helper("status", VIZ_PREVIEW_STATE_DIR="relative/state")
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("BLOCK", r.stderr)
        self.assertIn("absolute", r.stderr)

    def test_relative_worktree_is_rejected(self):
        r = self.run_helper("status", VIZ_PREVIEW_WORKTREE="relative/wt")
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("BLOCK", r.stderr)
        self.assertIn("absolute", r.stderr)

    def test_state_dir_inside_worktree_is_rejected(self):
        r = self.run_helper("status", VIZ_PREVIEW_STATE_DIR=str(self.worktree / "state"))
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("BLOCK", r.stderr)
        self.assertIn("outside any repo", r.stderr)

    def test_state_dir_inside_primary_checkout_is_rejected(self):
        # The intended state dir (a sibling of both repo/ and wt/) must pass — proving the check is
        # about containment, not merely "state dir != worktree".
        ok = self.run_helper("status")
        self.assertEqual(ok.returncode, 0, ok.stderr)

        r = self.run_helper("status", VIZ_PREVIEW_STATE_DIR=str(self.repo / "state"))
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("BLOCK", r.stderr)
        self.assertIn("primary checkout", r.stderr)

    def test_worktree_pointing_at_primary_checkout_is_rejected(self):
        # A primary checkout's .git is a DIRECTORY (a linked worktree's is a file pointing at the
        # real git-dir) — caught by the earlier not-a-linked-worktree check.
        r = self.run_helper("status", VIZ_PREVIEW_WORKTREE=str(self.repo))
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("BLOCK", r.stderr)
        self.assertIn("not a git worktree", r.stderr)

    def test_git_status_failure_fails_closed(self):
        # Make `git status` itself fail (index unreadable) while the worktree is still a
        # recognizable, valid linked worktree — and assert the helper dies loudly instead of
        # treating the unreadable state as "clean".
        git_dir = Path(
            subprocess.run(
                ["git", "-C", str(self.worktree), "rev-parse", "--absolute-git-dir"],
                check=True,
                capture_output=True,
                text=True,
            ).stdout.strip()
        )
        index_file = git_dir / "index"
        index_file.write_bytes(b"hi\n")  # a real index is committed already; overwrite with garbage
        os.chmod(index_file, 0o000)
        try:
            r = self.run_helper("use", "viz/topic", "--owner", "alice")
            self.assertNotEqual(r.returncode, 0, r.stdout)
            self.assertIn("git status failed", r.stderr)
        finally:
            os.chmod(index_file, 0o644)

    def test_status_free_initially(self):
        r = self.run_helper("status")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("FREE", r.stdout)

    def test_use_then_status_reflects_claim(self):
        r = self.run_helper("use", "viz/topic", "--owner", "alice")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("CLAIMED owner=alice branch=viz/topic", r.stdout)

        r = self.run_helper("status")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("owner=alice", r.stdout)
        self.assertIn("branch=viz/topic", r.stdout)
        self.assertIn("dirty=no", r.stdout)

    def test_claim_worktree_drift_fails_closed_instead_of_reaffirming(self):
        claim = self.run_helper("use", "viz/topic", "--owner", "alice")
        self.assertEqual(claim.returncode, 0, claim.stderr)

        # Drift the worktree off the claimed branch WITHOUT going through the helper (simulates a
        # human/agent manually checking something out, or an external tool touching the worktree).
        subprocess.run(["git", "-C", str(self.worktree), "checkout", "-q", "--detach", "HEAD"], check=True)

        r = self.run_helper("use", "viz/topic", "--owner", "alice")
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("BLOCK", r.stderr)
        self.assertIn("drift", r.stderr)

        # The claim record itself must be unchanged by the failed reaffirm attempt.
        status = self.run_helper("status")
        self.assertIn("owner=alice", status.stdout)
        self.assertIn("branch=viz/topic", status.stdout)

    def test_switching_to_an_existing_local_branch_preserves_unpushed_commits(self):
        # Claim, commit something LOCALLY-ONLY (never pushed), then release (clean tree — the commit
        # itself doesn't count as dirty).
        first = self.run_helper("use", "viz/topic", "--owner", "alice")
        self.assertEqual(first.returncode, 0, first.stderr)
        (self.worktree / "local_only.txt").write_text("unpushed work\n", encoding="utf-8")
        subprocess.run(["git", "-C", str(self.worktree), "add", "local_only.txt"], check=True)
        subprocess.run(
            ["git", "-C", str(self.worktree), "commit", "-q", "-m", "local-only commit"], check=True
        )
        unpushed_sha = self.head_sha()
        release = self.run_helper("release", "--owner", "alice")
        self.assertEqual(release.returncode, 0, release.stderr)

        # Reclaim the SAME branch (now an existing local branch with a commit origin/main lacks).
        # A `checkout -B` here would silently reset it back to origin/main and lose that commit.
        second = self.run_helper("use", "viz/topic", "--owner", "bob")
        self.assertEqual(second.returncode, 0, second.stderr)
        self.assertEqual(unpushed_sha, self.head_sha())
        self.assertTrue((self.worktree / "local_only.txt").exists())

    def test_idempotent_reuse_same_owner_same_branch(self):
        first = self.run_helper("use", "viz/topic", "--owner", "alice")
        self.assertEqual(first.returncode, 0, first.stderr)

        second = self.run_helper("use", "viz/topic", "--owner", "alice")
        self.assertEqual(second.returncode, 0, second.stderr)
        self.assertIn("REAFFIRMED", second.stdout)

        # Idempotent reuse must survive a dirty tree (resuming mid-edit is the common case).
        self.dirty_worktree()
        third = self.run_helper("use", "viz/topic", "--owner", "alice")
        self.assertEqual(third.returncode, 0, third.stderr)
        self.assertIn("REAFFIRMED", third.stdout)

    def test_claim_conflict_blocks_a_different_owner(self):
        first = self.run_helper("use", "viz/topic", "--owner", "alice")
        self.assertEqual(first.returncode, 0, first.stderr)

        second = self.run_helper("use", "viz/topic", "--owner", "bob")
        self.assertEqual(second.returncode, 1, second.stdout)
        self.assertIn("BLOCK", second.stderr)
        self.assertIn("conflicting claim", second.stderr)
        self.assertIn("owner=alice", second.stderr)

        # The conflict must not have mutated the claim: status still shows alice.
        status = self.run_helper("status")
        self.assertIn("owner=alice", status.stdout)

    def test_dirty_release_blocked(self):
        claim = self.run_helper("use", "viz/topic", "--owner", "alice")
        self.assertEqual(claim.returncode, 0, claim.stderr)
        self.dirty_worktree()

        release = self.run_helper("release", "--owner", "alice")
        self.assertEqual(release.returncode, 1, release.stdout)
        self.assertIn("BLOCK", release.stderr)
        self.assertIn("uncommitted changes", release.stderr)

        # The claim must survive a blocked release.
        status = self.run_helper("status")
        self.assertIn("owner=alice", status.stdout)
        self.assertIn("dirty=yes", status.stdout)

    def test_release_clean_detaches_and_clears(self):
        claim = self.run_helper("use", "viz/topic", "--owner", "alice")
        self.assertEqual(claim.returncode, 0, claim.stderr)

        release = self.run_helper("release", "--owner", "alice")
        self.assertEqual(release.returncode, 0, release.stderr)
        self.assertIn("RELEASED", release.stdout)

        status = self.run_helper("status")
        self.assertIn("FREE", status.stdout)

        branch = subprocess.run(
            ["git", "-C", str(self.worktree), "symbolic-ref", "-q", "--short", "HEAD"],
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(branch.returncode, 0, "expected a detached HEAD after release")

    def test_explicit_break_clears_regardless_of_owner_and_never_touches_worktree(self):
        claim = self.run_helper("use", "viz/topic", "--owner", "alice")
        self.assertEqual(claim.returncode, 0, claim.stderr)
        self.dirty_worktree()
        head_before = self.head_sha()
        branch_before = subprocess.run(
            ["git", "-C", str(self.worktree), "symbolic-ref", "-q", "--short", "HEAD"],
            capture_output=True,
            text=True,
        ).stdout.strip()

        brk = self.run_helper("break", "--reason", "stuck session", "--owner", "supervisor")
        self.assertEqual(brk.returncode, 0, brk.stderr)
        self.assertIn("BROKEN", brk.stdout)
        self.assertIn("owner=alice", brk.stdout)

        status = self.run_helper("status")
        self.assertIn("FREE", status.stdout)
        # status must surface the dirty leftover break() deliberately didn't clean up, not hide it
        # behind a bare "FREE".
        self.assertIn("dirty=yes", status.stdout)

        # break must never touch the worktree's git state or files: same branch, same HEAD, still dirty.
        branch_after = subprocess.run(
            ["git", "-C", str(self.worktree), "symbolic-ref", "-q", "--short", "HEAD"],
            capture_output=True,
            text=True,
        ).stdout.strip()
        self.assertEqual(branch_before, branch_after)
        self.assertEqual(head_before, self.head_sha())
        self.assertTrue((self.worktree / "f.txt").read_text(encoding="utf-8").endswith("dirty\n"))

        # A different owner can now claim it (the conflict is gone), but use() still refuses to
        # switch over the dirty leftover break() deliberately didn't clean up.
        reclaim = self.run_helper("use", "viz/other", "--owner", "carol")
        self.assertEqual(reclaim.returncode, 1, reclaim.stdout)
        self.assertIn("dirty", reclaim.stderr)

    def test_break_on_free_is_a_noop(self):
        r = self.run_helper("break", "--reason", "nothing to do")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("FREE", r.stdout)

    def test_status_never_mutates_the_worktree(self):
        head_before = self.head_sha()
        self.run_helper("status")
        self.assertEqual(head_before, self.head_sha())

        claim = self.run_helper("use", "viz/topic", "--owner", "alice")
        self.assertEqual(claim.returncode, 0, claim.stderr)
        head_claimed = self.head_sha()
        branch_claimed = subprocess.run(
            ["git", "-C", str(self.worktree), "symbolic-ref", "-q", "--short", "HEAD"],
            capture_output=True,
            text=True,
        ).stdout.strip()

        for _ in range(3):
            r = self.run_helper("status")
            self.assertEqual(r.returncode, 0, r.stderr)

        self.assertEqual(head_claimed, self.head_sha())
        branch_after = subprocess.run(
            ["git", "-C", str(self.worktree), "symbolic-ref", "-q", "--short", "HEAD"],
            capture_output=True,
            text=True,
        ).stdout.strip()
        self.assertEqual(branch_claimed, branch_after)

    def test_malformed_claim_file_blocks_every_subcommand(self):
        self.state_dir.mkdir(parents=True, exist_ok=True)
        (self.state_dir / "claim.json").write_text("not json{{{", encoding="utf-8")

        for args in (["status"], ["use", "viz/topic", "--owner", "alice"], ["release", "--owner", "alice"]):
            r = self.run_helper(*args)
            self.assertEqual(r.returncode, 1, f"{args} -> {r.stdout}")
            self.assertIn("BLOCK", r.stderr)
            self.assertIn("malformed", r.stderr)

        # break is the one command allowed to clear even a malformed record.
        brk = self.run_helper("break", "--reason", "clear malformed record")
        self.assertEqual(brk.returncode, 0, brk.stderr)
        status = self.run_helper("status")
        self.assertIn("FREE", status.stdout)

    def test_concurrent_use_exactly_one_claimant_wins(self):
        results = {}

        def attempt(owner):
            results[owner] = self.run_helper("use", "viz/race", "--owner", owner)

        threads = [threading.Thread(target=attempt, args=(o,)) for o in ("alice", "bob")]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        codes = sorted(r.returncode for r in results.values())
        self.assertEqual(codes, [0, 1], {o: (r.returncode, r.stdout, r.stderr) for o, r in results.items()})

        winner = next(o for o, r in results.items() if r.returncode == 0)
        status = self.run_helper("status")
        self.assertIn(f"owner={winner}", status.stdout)
        self.assertIn("branch=viz/race", status.stdout)

    # -- Issue #201 regressions -------------------------------------------------------------

    def test_failed_use_retains_reservation_blocks_others_then_resumes_for_same_owner(self):
        # Finding 1: break the remote so the `fetch` inside `use` fails AFTER the reservation
        # write lands (the same sequencing checkout_branch_safely would hit). Assert the claim is
        # retained fail-closed (never an unclaimed switched worktree), a DIFFERENT owner cannot
        # steal it during the failure window (the actual race #201 exists to close), and the SAME
        # owner retrying resumes it instead of hitting the drift block.
        subprocess.run(
            ["git", "-C", str(self.repo), "remote", "set-url", "origin", "/nonexistent/origin.git"],
            check=True,
        )

        first = self.run_helper("use", "viz/newbranch", "--owner", "alice")
        self.assertNotEqual(first.returncode, 0, first.stdout)
        self.assertIn("fetch", first.stderr)

        status = self.run_helper("status")
        self.assertEqual(status.returncode, 0, status.stderr)
        self.assertIn("RESERVING", status.stdout)
        self.assertIn("owner=alice", status.stdout)
        self.assertIn("branch=viz/newbranch", status.stdout)

        branch_check = subprocess.run(
            ["git", "-C", str(self.worktree), "symbolic-ref", "-q", "--short", "HEAD"],
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(branch_check.returncode, 0, "worktree must not have been switched")

        stolen = self.run_helper("use", "viz/newbranch", "--owner", "mallory")
        self.assertEqual(stolen.returncode, 1, stolen.stdout)
        self.assertIn("BLOCK", stolen.stderr)
        self.assertIn("conflicting reservation", stolen.stderr)

        # Fix the remote; the SAME owner's retry must resume (not hit "drift") and finalize.
        subprocess.run(
            ["git", "-C", str(self.repo), "remote", "set-url", "origin", str(self.upstream)], check=True
        )
        resumed = self.run_helper("use", "viz/newbranch", "--owner", "alice")
        self.assertEqual(resumed.returncode, 0, resumed.stderr)
        self.assertIn("CLAIMED owner=alice branch=viz/newbranch", resumed.stdout)

        status2 = self.run_helper("status")
        self.assertIn("CLAIMED", status2.stdout)
        self.assertIn("owner=alice", status2.stdout)

    def test_claim_record_without_phase_field_is_treated_as_active(self):
        # A record written by pre-#201 code (or an already-held claim at deploy time) has no
        # `phase` key at all — it must read as an ordinary active claim, never `reserving`.
        self.state_dir.mkdir(parents=True, exist_ok=True)
        (self.state_dir / "claim.json").write_text(
            json.dumps({"owner": "alice", "branch": "viz/topic", "claimed_at": "2020-01-01T00:00:00Z"}),
            encoding="utf-8",
        )

        status = self.run_helper("status")
        self.assertEqual(status.returncode, 0, status.stderr)
        self.assertIn("CLAIMED owner=alice branch=viz/topic", status.stdout)
        self.assertNotIn("RESERVING", status.stdout)

    def test_status_does_not_refresh_git_index(self):
        # Finding 2: backdate a tracked file's mtime (content unchanged, so the tree stays clean)
        # to force git's index stat-cache stale — a plain `git status` would then rewrite the
        # index to refresh that cache. Asserting the index is merely "unchanged" without this step
        # can pass vacuously on a freshly-checked-out worktree with nothing stale to refresh; this
        # reproduces the mutation on the pre-fix command and only passes with --no-optional-locks.
        tracked = self.worktree / "f.txt"
        old_time = time.time() - 3600
        os.utime(tracked, (old_time, old_time))

        git_dir = Path(
            subprocess.run(
                ["git", "-C", str(self.worktree), "rev-parse", "--absolute-git-dir"],
                check=True,
                capture_output=True,
                text=True,
            ).stdout.strip()
        )
        index_file = git_dir / "index"
        before = index_file.read_bytes()

        r = self.run_helper("status")
        self.assertEqual(r.returncode, 0, r.stderr)

        after = index_file.read_bytes()
        self.assertEqual(before, after, "status must not refresh the git index")

    def test_status_reads_claim_record_in_a_single_python_invocation(self):
        # Finding 3: a torn read across multiple python3 invocations (the original classify_claim
        # + 3x get_field) could observe a claim concurrently modified between reads. Assert
        # `status` makes exactly one python3 call against claim.json, proving the read is a single
        # snapshot — reproduces the multi-call count on the pre-fix implementation and catches any
        # future regression back to separate reads mechanically, not just by inspection.
        claim = self.run_helper("use", "viz/topic", "--owner", "alice")
        self.assertEqual(claim.returncode, 0, claim.stderr)

        call_log = self.root / "python3_calls.log"
        wrapper_dir = self.root / "bin"
        wrapper_dir.mkdir(exist_ok=True)
        real_python3 = shutil.which("python3")
        wrapper = wrapper_dir / "python3"
        wrapper.write_text(
            f'#!/bin/bash\necho called >> "{call_log}"\nexec "{real_python3}" "$@"\n',
            encoding="utf-8",
        )
        wrapper.chmod(0o755)

        env = self.env()
        env["PATH"] = f"{wrapper_dir}{os.pathsep}{env['PATH']}"
        r = subprocess.run([str(HELPER), "status"], capture_output=True, text=True, env=env)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("owner=alice", r.stdout)
        self.assertIn("branch=viz/topic", r.stdout)

        calls = call_log.read_text(encoding="utf-8").splitlines() if call_log.exists() else []
        self.assertEqual(
            len(calls), 1, f"expected exactly one python3 invocation for a claim read, got {len(calls)}"
        )


if __name__ == "__main__":
    unittest.main()
