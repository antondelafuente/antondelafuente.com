#!/bin/bash
# preview_claim.sh — the visualization-preview worktree CLAIM: status/use/release/break over a
# pre-provisioned, single stable git worktree. Repository/config-neutral: it manages a git worktree
# + a claim record, nothing about what's built inside the worktree (no npm, no server). State lives
# OUTSIDE any repo (never committed), and every path/ref is supplied by env, never guessed:
#
#   VIZ_PREVIEW_WORKTREE   required — absolute path to the pre-provisioned worktree this helper
#                          operates on (created once, out of band, via
#                          `git worktree add <path> --detach <base-ref>`; this script never creates
#                          or removes it).
#   VIZ_PREVIEW_STATE_DIR  required — absolute path (outside any repo) holding the claim record +
#                          lock file.
#   VIZ_PREVIEW_BASE_REF   required — the ref `release` returns the worktree to, detached (e.g.
#                          `origin/main`).
#   VIZ_PREVIEW_URL        optional — a human-readable URL echoed by `status`/`use`; never read by
#                          any git operation this script performs.
#
# COMMANDS
#   status                          read-only, never mutates (single locked-free snapshot read):
#                                   prints FREE, or CLAIMED owner=.. branch=.. since=.. dirty=..,
#                                   or RESERVING owner=.. branch=.. since=.. dirty=.. (a claim taken
#                                   but not yet checked out — mid-`use`, or a failed/crashed one
#                                   awaiting retry), then worktree=.. url=..
#   use <branch> --owner <name>     claim / idempotently reaffirm / switch / resume — see cmd_use
#                                   for the full state-transition table. A new claim is written as a
#                                   RESERVING record BEFORE fetch/checkout, then finalized to CLAIMED
#                                   once checkout confirms — so any failure in between leaves the
#                                   claim fail-closed (retained, blocking other claimants) rather
#                                   than an unclaimed switched worktree; the same owner retrying
#                                   resumes the reservation instead of starting over.
#   release --owner <name>          clears the caller's own claim (RESERVING or CLAIMED); BLOCKs if
#                                   the tree is dirty (never discards uncommitted work) or if a
#                                   different owner holds the claim (use `break` for that).
#   break --reason "<text>" [--owner <name>]
#                                   the explicit, logged escape hatch for a stuck claim: clears the
#                                   claim record UNCONDITIONALLY (owner mismatch and dirty tree both
#                                   bypassed) but NEVER touches the worktree's git state or file
#                                   contents — only the claim record. Requires --reason.
#
# No auto-expiry, anywhere: a claim is only ever cleared by `release` or `break`. `status` takes no
# lock, performs no git mutation, and never refreshes the git index (branch-switch/mutation safety).
# `use`/`release` never git-checkout over a dirty tree; `break` never touches the tree at all.
set -euo pipefail

die(){ echo "preview_claim: $*" >&2; exit 2; }
block(){ echo "BLOCK: $*" >&2; exit 1; }

require_env(){ # <name>
  local v="${!1:-}"
  [ -n "$v" ] || block "$1 is not set — the instance must supply it (never guessed)"
}

# require_abs_path: a relative value would resolve differently depending on the caller's cwd — two
# invocations of this helper from different directories could then silently address DIFFERENT state
# dirs (or worktrees) for what was meant to be the same one, defeating the lock/claim entirely.
require_abs_path(){ # <name> <value>
  case "$2" in
    /*) : ;;
    *) block "$1 must be an absolute path (got: '$2')" ;;
  esac
}

require_env VIZ_PREVIEW_WORKTREE
require_env VIZ_PREVIEW_STATE_DIR
require_env VIZ_PREVIEW_BASE_REF
require_abs_path VIZ_PREVIEW_WORKTREE "$VIZ_PREVIEW_WORKTREE"
require_abs_path VIZ_PREVIEW_STATE_DIR "$VIZ_PREVIEW_STATE_DIR"
command -v realpath >/dev/null 2>&1 || die "realpath is required (coreutils)"
# Canonicalize both (resolve symlinks/'..') so two differently-spelled-but-equal paths can never
# address two different lock/claim files for the same underlying worktree.
WT=$(realpath -e -- "$VIZ_PREVIEW_WORKTREE") || block "VIZ_PREVIEW_WORKTREE ($VIZ_PREVIEW_WORKTREE) does not exist"
ROOT=$(realpath -m -- "$VIZ_PREVIEW_STATE_DIR")   # -m: the state dir may not exist yet (created on first use)
BASE_REF="$VIZ_PREVIEW_BASE_REF"
URL="${VIZ_PREVIEW_URL:-}"

# A linked worktree's .git is a FILE (pointing at <main>/.git/worktrees/<name>); the PRIMARY checkout's
# .git is a directory. Reject the primary-checkout case explicitly — a misconfigured
# VIZ_PREVIEW_WORKTREE pointing at a shared main checkout must never be fetched/switched/detached by
# this helper.
[ -f "$WT/.git" ] || block "VIZ_PREVIEW_WORKTREE ($WT) is not a git worktree — provision it first: git worktree add $WT --detach $BASE_REF"
GIT_DIR_RAW=$(git -C "$WT" rev-parse --git-dir 2>/dev/null) || block "VIZ_PREVIEW_WORKTREE ($WT) is not inside a git repository"
GIT_COMMON_DIR_RAW=$(git -C "$WT" rev-parse --git-common-dir 2>/dev/null) || block "VIZ_PREVIEW_WORKTREE ($WT) is not inside a git repository"
# rev-parse may print a path relative to $WT (git-version-dependent) — resolve it FROM $WT so a
# relative result still canonicalizes correctly, regardless of this shell's own cwd.
GIT_DIR=$(cd "$WT" && realpath -e -- "$GIT_DIR_RAW") || block "could not resolve VIZ_PREVIEW_WORKTREE's git-dir"
GIT_COMMON_DIR=$(cd "$WT" && realpath -e -- "$GIT_COMMON_DIR_RAW") || block "could not resolve VIZ_PREVIEW_WORKTREE's git-common-dir"
[ "$GIT_DIR" != "$GIT_COMMON_DIR" ] || block "VIZ_PREVIEW_WORKTREE ($WT) is the PRIMARY checkout, not a linked worktree — refusing to operate on a shared main checkout"
# The primary checkout's root is the git-common-dir's parent (git-common-dir is always
# <primary-checkout>/.git, for both the primary checkout itself and every worktree linked to it).
PRIMARY_ROOT=$(dirname "$GIT_COMMON_DIR")

# is_within_or_equal: true iff <path> IS <base>, or is a descendant of it. Both operands are already
# realpath-canonicalized by the callers below, so this is a plain string-prefix test.
is_within_or_equal(){ # <path> <base>
  case "$1" in
    "$2"|"$2"/*) return 0 ;;
    *) return 1 ;;
  esac
}

# "Claims record ... outside the repo" is a correctness requirement, not just a convention: state
# living inside the worktree would be wiped/hidden by the very git operations this helper performs
# (checkout/detach), and state inside the primary checkout would pollute a tree this helper must
# never touch. Fail closed on either.
is_within_or_equal "$ROOT" "$WT" && block "VIZ_PREVIEW_STATE_DIR ($ROOT) is inside the preview worktree ($WT) — claim state must live outside any repo"
is_within_or_equal "$ROOT" "$PRIMARY_ROOT" && block "VIZ_PREVIEW_STATE_DIR ($ROOT) is inside the repository's primary checkout ($PRIMARY_ROOT) — claim state must live outside any repo"

CLAIM_FILE="$ROOT/claim.json"
LOCK_FILE="$ROOT/claim.lock"
BREAK_LOG="$ROOT/breaks.log"

require_val(){ [ -n "${2:-}" ] || die "$1 requires a non-empty value"; }

# A branch/owner is used as a filename-adjacent token nowhere, but IS embedded in a shell-adjacent
# log line — restrict to a conservative safe charset so a stray value can't do anything surprising.
validate_token(){ # <what> <value>
  case "$2" in
    *[!A-Za-z0-9._@/-]*) die "invalid $1 '$2' (allowed: A-Za-z0-9._@/-)" ;;
    ""|.|..) die "invalid $1 '$2'" ;;
  esac
}

# classify_claim: absent | invalid | reserving | active — a malformed record is NEVER read as
# empty/free (fail-closed), matching pod_lease.sh's classify_record precedent. `phase` distinguishes
# a reservation taken before checkout (reserving) from one whose checkout is confirmed (active); a
# record with no `phase` key at all — every claim written before this distinction existed, including
# one already held at deploy time — reads as active, so nothing already-claimed is disturbed.
classify_claim(){
  python3 - "$CLAIM_FILE" <<'PY'
import json, os, sys
path = sys.argv[1]
if not os.path.exists(path):
    print("absent"); sys.exit(0)
try:
    d = json.load(open(path))
    if not isinstance(d, dict) or not all(k in d for k in ("owner", "branch", "claimed_at")):
        raise ValueError
    phase = d.get("phase", "active")
    if phase not in ("reserving", "active"):
        raise ValueError
except Exception:
    print("invalid"); sys.exit(0)
print(phase)
PY
}

get_field(){ # <field>
  python3 - "$CLAIM_FILE" "$1" <<'PY' 2>/dev/null || true
import json, sys
try:
    d = json.load(open(sys.argv[1]))
except Exception:
    sys.exit(0)
v = d.get(sys.argv[2])
if v is not None:
    print(v)
PY
}

# read_claim_snapshot: `status` classifying the record and then reading its fields as separate
# unlocked python3 calls (the original classify_claim + 3x get_field) leaves a window where a
# concurrent release/break between those calls can tear the read — e.g. a state read as active
# whose subsequently-read fields no longer exist. `status` deliberately takes no lock (never
# blocks), so the fix is one python3 process, one open() of claim.json, one consistent snapshot.
# Prints 4 lines: state (absent|invalid|reserving|active), owner, branch, claimed_at — the latter
# three blank unless state is reserving/active. Same phase-default-to-active rule as classify_claim.
read_claim_snapshot(){
  python3 - "$CLAIM_FILE" <<'PY'
import json, os, sys
path = sys.argv[1]
def blank():
    print(""); print(""); print("")
if not os.path.exists(path):
    print("absent"); blank(); sys.exit(0)
try:
    d = json.load(open(path))
    if not isinstance(d, dict) or not all(k in d for k in ("owner", "branch", "claimed_at")):
        raise ValueError
    phase = d.get("phase", "active")
    if phase not in ("reserving", "active"):
        raise ValueError
except Exception:
    print("invalid"); blank(); sys.exit(0)
print(phase)
print(d.get("owner", ""))
print(d.get("branch", ""))
print(d.get("claimed_at", ""))
PY
}

# Atomically write the FULL claim record (create or overwrite — a claim's owner/branch/claimed_at/
# phase are always all-or-nothing, never a partial patch). tempfile + fsync + os.replace, same idiom
# as pod_lease.sh's write_record.
write_claim(){ # OWNER= BRANCH= CLAIMED_AT= PHASE= (env)
  mkdir -p "$ROOT"
  python3 - "$CLAIM_FILE" <<'PY'
import json, os, sys, tempfile
path = sys.argv[1]
rec = {
    "owner": os.environ["OWNER"],
    "branch": os.environ["BRANCH"],
    "claimed_at": os.environ["CLAIMED_AT"],
    "phase": os.environ["PHASE"],
}
d = os.path.dirname(path) or "."
fd, tmp = tempfile.mkstemp(dir=d, prefix=".claim.", suffix=".tmp")
try:
    with os.fdopen(fd, "w") as f:
        json.dump(rec, f, indent=2, sort_keys=True)
        f.write("\n")
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)
except Exception:
    try:
        os.unlink(tmp)
    except OSError:
        pass
    raise
PY
}

clear_claim(){ rm -f "$CLAIM_FILE"; }

is_dirty(){ # exit 0 = dirty, 1 = clean; a failed `git status` fails CLOSED (never masqueraded as clean)
  local out rc=0
  # --no-optional-locks: a plain `git status` refreshes the on-disk index (a real mutation) as a
  # side effect — this probe must never write, including when called from the read-only `status`
  # subcommand, so every caller gets the non-mutating form.
  out=$(git -C "$WT" --no-optional-locks status --porcelain 2>&1) || rc=$?
  [ "$rc" -eq 0 ] || die "git status failed in $WT (exit $rc): $out"
  [ -n "$out" ]
}

# current_branch: the worktree's checked-out branch name, or empty if HEAD is detached.
current_branch(){ git -C "$WT" symbolic-ref -q --short HEAD 2>/dev/null || true; }

# checkout_branch_safely: move the worktree onto <branch> WITHOUT ever resetting an existing local
# branch's tip. `git checkout -B` would silently reset an already-existing local <branch> to
# origin/<branch> (or to $BASE_REF), discarding any commits made on it that were never pushed — e.g.
# a prior claim that committed locally, released, and is now being reclaimed. Resolve in the safe
# order: an existing LOCAL branch is switched to as-is (never reset); only a genuinely new local
# branch is created, from origin/<branch> if that remote ref exists, else from $BASE_REF.
checkout_branch_safely(){ # <branch>
  local branch="$1"
  if git -C "$WT" rev-parse --verify -q "refs/heads/$branch" >/dev/null; then
    git -C "$WT" checkout -q "$branch"
  elif git -C "$WT" rev-parse --verify -q "origin/$branch" >/dev/null; then
    git -C "$WT" checkout -q -b "$branch" "origin/$branch"
  else
    git -C "$WT" checkout -q -b "$branch" "$BASE_REF"
  fi
}

with_lock(){ # <fn> [args...]  — serializes use/release/break; status takes no lock (read-only).
  mkdir -p "$ROOT"
  exec 9>"$LOCK_FILE"
  flock 9
  "$@"
}

now_iso(){ date -u +%Y-%m-%dT%H:%M:%SZ; }

cmd_status(){
  local state owner branch since
  { read -r state; read -r owner; read -r branch; read -r since; } < <(read_claim_snapshot)
  case "$state" in
    absent)
      # Surface a dirty leftover from a broken claim here too — `break` deliberately never cleans
      # the worktree, so `status` must not hide that a "FREE" worktree is still dirty.
      local dirty=no
      is_dirty && dirty=yes
      echo "FREE dirty=$dirty"
      ;;
    invalid) block "claim record at $CLAIM_FILE is malformed — inspect it by hand, or run 'break' to clear it" ;;
    reserving)
      local dirty=no
      is_dirty && dirty=yes
      echo "RESERVING owner=$owner branch=$branch since=$since dirty=$dirty"
      ;;
    active)
      local dirty=no
      is_dirty && dirty=yes
      echo "CLAIMED owner=$owner branch=$branch since=$since dirty=$dirty"
      ;;
  esac
  echo "worktree=$WT"
  echo "url=${URL:-unset}"
}

# use: the state-transition table (see the header comment for the summary).
cmd_use(){
  local branch="${1:-}"; shift || true
  require_val "<branch>" "$branch"
  validate_token branch "$branch"
  local owner=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --owner) require_val --owner "${2:-}"; owner=$2; shift 2 ;;
      *) die "use: unknown arg '$1'" ;;
    esac
  done
  require_val --owner "$owner"
  validate_token owner "$owner"

  local state; state=$(classify_claim)
  case "$state" in
    invalid) block "claim record at $CLAIM_FILE is malformed — inspect it by hand, or run 'break' to clear it" ;;
    active)
      local cur_owner cur_branch
      cur_owner=$(get_field owner); cur_branch=$(get_field branch)
      if [ "$cur_owner" != "$owner" ]; then
        block "conflicting claim: owner=$cur_owner branch=$cur_branch since=$(get_field claimed_at) — ask them to release, or run 'break' to force-clear (explicit, logged)"
      fi
      if [ "$cur_branch" = "$branch" ]; then
        # Idempotent reuse: same owner, same branch — but never blindly trust a stale record. If the
        # worktree has drifted off the claimed branch (someone checked out something else, or
        # detached, outside this helper), fail closed instead of reaffirming a claim that no longer
        # matches reality.
        local actual; actual=$(current_branch)
        if [ "$actual" != "$branch" ]; then
          block "claim/worktree drift: the claim says branch=$branch but the worktree is actually on '${actual:-<detached>}' — reconcile by hand (git -C $WT checkout $branch) or run 'break' to reset the claim"
        fi
        # Reaffirm only: no git operation, dirty is fine (resuming mid-edit is the common case).
        OWNER="$owner" BRANCH="$branch" CLAIMED_AT="$(now_iso)" PHASE=active write_claim
        echo "REAFFIRMED owner=$owner branch=$branch"
        echo "worktree=$WT"
        echo "url=${URL:-unset}"
        return 0
      fi
      # Same owner, a DIFFERENT branch: switching requires a clean tree.
      is_dirty && block "worktree has uncommitted changes on branch '$cur_branch' — commit, release, or break before switching to '$branch'"
      ;;
    reserving)
      # A reservation with no confirmed checkout yet — either a `use` is still running elsewhere, or
      # a prior attempt failed/crashed after reserving but before finalizing.
      local cur_owner cur_branch cur_claimed_at
      cur_owner=$(get_field owner); cur_branch=$(get_field branch); cur_claimed_at=$(get_field claimed_at)
      if [ "$cur_owner" != "$owner" ]; then
        block "conflicting reservation: owner=$cur_owner branch=$cur_branch since=$cur_claimed_at is mid-claim (phase=reserving; a prior 'use' may still be running or may have failed) — ask them to retry it, or run 'break' to force-clear (explicit, logged)"
      fi
      if [ "$cur_branch" != "$branch" ]; then
        block "cannot switch to '$branch': your own reservation on '$cur_branch' (since=$cur_claimed_at, phase=reserving) hasn't finished — retry 'use $cur_branch --owner $owner' to resume it, or 'break' to abandon it first"
      fi
      # Same owner, same branch, resuming their own incomplete reservation: retry the checkout —
      # there is no confirmed prior checkout to compare `current_branch` against (unlike the `active`
      # case above), so there is nothing to call "drift"; retrying IS the correct recovery.
      is_dirty && block "worktree has uncommitted changes while resuming reservation owner=$owner branch=$branch — commit, or run 'break' to release, before retrying"
      git -C "$WT" fetch -q origin || die "git fetch origin failed (reservation retained: owner=$owner branch=$branch phase=reserving — retry to resume, or 'break --reason ...' to release)"
      checkout_branch_safely "$branch" || die "checkout failed (reservation retained: owner=$owner branch=$branch phase=reserving — retry to resume, or 'break --reason ...' to release)"
      OWNER="$owner" BRANCH="$branch" CLAIMED_AT="$cur_claimed_at" PHASE=active write_claim || die "checkout succeeded but finalizing the claim failed (reservation retained: owner=$owner branch=$branch phase=reserving — retry to resume, or 'break --reason ...' to release)"
      echo "CLAIMED owner=$owner branch=$branch"
      echo "worktree=$WT"
      echo "url=${URL:-unset}"
      return 0
      ;;
    absent)
      # A broken claim can leave dirty leftovers; use() never discards them, claimed or not.
      is_dirty && block "worktree is dirty despite no active claim (a broken claim's leftover?) — inspect $WT by hand before claiming"
      ;;
  esac

  # New claim (from absent, or an active claim switching branches): reserve BEFORE fetch/checkout so
  # any failure below (fetch, checkout, even this reservation's own write) leaves the claim record
  # fail-closed — pointing at (owner, branch, phase=reserving) — rather than an unclaimed but
  # already-switched worktree. A DIFFERENT claimant hitting this reservation is blocked by the
  # `reserving)` branch above; the SAME owner retrying resumes there instead of starting over.
  local claimed_at; claimed_at="$(now_iso)"
  OWNER="$owner" BRANCH="$branch" CLAIMED_AT="$claimed_at" PHASE=reserving write_claim
  git -C "$WT" fetch -q origin || die "git fetch origin failed (reservation retained: owner=$owner branch=$branch phase=reserving — retry to resume, or 'break --reason ...' to release)"
  checkout_branch_safely "$branch" || die "checkout failed (reservation retained: owner=$owner branch=$branch phase=reserving — retry to resume, or 'break --reason ...' to release)"
  OWNER="$owner" BRANCH="$branch" CLAIMED_AT="$claimed_at" PHASE=active write_claim || die "checkout succeeded but finalizing the claim failed (reservation retained: owner=$owner branch=$branch phase=reserving — retry to resume, or 'break --reason ...' to release)"
  echo "CLAIMED owner=$owner branch=$branch"
  echo "worktree=$WT"
  echo "url=${URL:-unset}"
}

cmd_release(){
  local owner=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --owner) require_val --owner "${2:-}"; owner=$2; shift 2 ;;
      *) die "release: unknown arg '$1'" ;;
    esac
  done
  require_val --owner "$owner"
  validate_token owner "$owner"

  local state; state=$(classify_claim)
  case "$state" in
    absent) echo "FREE (nothing to release)"; return 0 ;;
    invalid) block "claim record at $CLAIM_FILE is malformed — inspect it by hand, or run 'break' to clear it" ;;
    active|reserving)
      local cur_owner; cur_owner=$(get_field owner)
      [ "$cur_owner" = "$owner" ] || block "cannot release: claim is held by owner=$cur_owner, not '$owner' — run 'break' to force-clear"
      ;;
  esac

  is_dirty && block "refusing to release: worktree has uncommitted changes — commit or discard them first"

  git -C "$WT" fetch -q origin || die "git fetch origin failed"
  git -C "$WT" checkout -q --detach "$BASE_REF" || die "checkout --detach $BASE_REF failed"
  clear_claim
  echo "RELEASED (worktree detached at $BASE_REF)"
}

cmd_break(){
  local reason="" owner=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --reason) require_val --reason "${2:-}"; reason=$2; shift 2 ;;
      --owner) require_val --owner "${2:-}"; owner=$2; shift 2 ;;
      *) die "break: unknown arg '$1'" ;;
    esac
  done
  require_val --reason "$reason"

  local state; state=$(classify_claim)
  if [ "$state" = absent ]; then
    echo "FREE (nothing to break)"; return 0
  fi
  local prior_owner="?" prior_branch="?"
  case "$state" in
    active|reserving) prior_owner=$(get_field owner); prior_branch=$(get_field branch) ;;
  esac

  mkdir -p "$ROOT"
  printf '%s breaker=%s prior_owner=%s prior_branch=%s reason=%s\n' \
    "$(now_iso)" "${owner:-unspecified}" "$prior_owner" "$prior_branch" "$reason" >> "$BREAK_LOG"
  clear_claim

  if is_dirty; then
    echo "BROKEN (was owner=$prior_owner branch=$prior_branch) — worktree still has uncommitted changes from that claim; not touched"
  else
    echo "BROKEN (was owner=$prior_owner branch=$prior_branch)"
  fi
}

main(){
  local sub="${1:-}"; shift || true
  case "$sub" in
    status) [ $# -eq 0 ] || die "status: takes no arguments"; cmd_status ;;
    use) with_lock cmd_use "$@" ;;
    release) with_lock cmd_release "$@" ;;
    break) with_lock cmd_break "$@" ;;
    "") die "usage: preview_claim.sh <status|use|release|break> ..." ;;
    *) die "unknown subcommand '$sub'" ;;
  esac
}

main "$@"
