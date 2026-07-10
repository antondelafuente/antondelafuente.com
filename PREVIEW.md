# The stable local visualization preview (and its publish path)

Canonical recipe for `site/` visualization work: how to get a stable, claimed local preview up, and
how the resulting page eventually publishes. This document is the target of **both** instance
aar-profile recipe pointers `visualize-results` reads (`[recipes.visualization_preview]` for local
iteration, `[recipes.visualization_publish]` for the explicit-publish leg — see
`automated-researcher`'s `visualize-results` skill; #369's schema keeps the two pointers
independently configured but explicitly allows them to name the same document). Nothing in this file
is instance-specific: every path, port, host, and URL below is supplied by the instance at run time,
never hardcoded here.

## Preview: claim, build, iterate locally

**One configured worktree, one stable URL, serving whichever branch is currently claimed.** An
instance supervisor keeps that worktree running (dev server or a static fallback) and serves it
*as-is* — the supervisor never switches branches itself; only an explicit claim command does.

### The claim lifecycle

`site/scripts/preview_claim.sh` is the tracked helper. It manages exactly one thing: a git worktree
(pre-provisioned by the instance) plus a claim record held **outside** the repo. It knows nothing
about npm, Vite, or ports — it never installs dependencies or starts a server.

Config (all supplied by the instance's environment, never guessed — a missing required value is a
`BLOCK`, not a fallback):

| Env var | Required | Meaning |
|---|---|---|
| `VIZ_PREVIEW_WORKTREE` | yes | Absolute path to the pre-provisioned stable worktree. |
| `VIZ_PREVIEW_STATE_DIR` | yes | Absolute path, outside any repo, for the claim record + lock. |
| `VIZ_PREVIEW_BASE_REF` | yes | The ref `release` returns the worktree to, detached (e.g. `origin/main`). |
| `VIZ_PREVIEW_URL` | no | The stable URL to report — purely informational, never used for git. |

Commands:

```bash
# Read-only. Never mutates the worktree. Shows who (if anyone) holds the preview.
site/scripts/preview_claim.sh status
# -> FREE
#    worktree=<path>  url=<url>
# or CLAIMED owner=<you> branch=<your-branch> since=<timestamp> dirty=<yes|no>
#    worktree=<path>  url=<url>
# or RESERVING owner=<you> branch=<your-branch> since=<timestamp> dirty=<yes|no>
#    worktree=<path>  url=<url>

# Claim the preview for <branch>, as <owner> (use a name that identifies YOU: session/agent id).
site/scripts/preview_claim.sh use <branch> --owner <owner>

# Give it back once you're done iterating (fails if the worktree is dirty — commit or discard first;
# never silently discards your work).
site/scripts/preview_claim.sh release --owner <owner>

# The explicit escape hatch for a STUCK claim (e.g. a crashed session). Clears the claim record
# unconditionally, but never touches the worktree's git state or files — a dirty leftover from the
# broken claim is still there afterward, surfaced by the next status/use, not silently discarded.
site/scripts/preview_claim.sh break --reason "<why>"
```

**How to use it, concretely.** `status` first — if another owner holds a clean claim, iterate on your
own local checkout instead of contending for the shared preview; if their claim looks abandoned
(stale timestamp, dirty tree nobody is touching), ask before `break`ing it. Otherwise:

```bash
site/scripts/preview_claim.sh use viz/<topic> --owner <you>
# edit site/src/... inside $VIZ_PREVIEW_WORKTREE/site (NOT any other checkout)
cd "$VIZ_PREVIEW_WORKTREE/site" && npm run build   # the required build check, below
# ask the researcher to look at $VIZ_PREVIEW_URL; iterate; repeat
site/scripts/preview_claim.sh release --owner <you>   # once done (or publishing — see below)
```

Re-claiming the *same* branch as the *same* owner is always a no-op success (idempotent), even with
uncommitted changes — resuming mid-edit is the common case, not an error. Switching to a *different*
branch, or claiming when free, requires a clean tree first.

**If `use` itself fails partway** (a network blip during the fetch, a checkout error), the claim is
retained rather than silently freed — `status` reads `RESERVING` for that owner/branch instead of
`FREE`, so a different owner can never grab the worktree mid-failure. Retry `use` with the *same*
`--owner`/branch to resume it (it re-fetches and re-checks-out, then finalizes to `CLAIMED`); use
`break` only if you want to abandon the reservation instead.

**Dependency install** happens only when `site/package-lock.json` changes; that, and actually running
the dev server, are the instance supervisor's job — not this helper's, and not this document's
concern (the helper is repository/config-neutral: a git worktree + a claim record, nothing about
what's built inside it).

## Page-style pattern — the CLEAN style

**`site/CLAUDE.md`'s "Visualization style — use the CLEAN style" section is the canonical style
rule** (typography-driven hierarchy, muted prose in narrow columns, thin left-border accents, no
card grids) — this recipe does not repeat it, only points at it. Shared page-building surface:
`site/src/components/ui/` (button, card, table, badge, input, select, tooltip) + `src/lib/utils.ts`'s
`cn()` helper. Two committed prior pages to pattern-match against:

- `site/src/routes/visualizations/2026-05-18/CapabilityEvals.tsx` — the original clean-style page.
- `site/src/routes/visualizations/2026-06-08/SpecArmsComparison.tsx` — a later example.

New route: file under `src/routes/visualizations/<slug>/`, add its `<Route>` in `src/App.tsx`, add its
gallery card in `src/routes/Visualizations.tsx`. Static eval data belongs in `src/data/<experiment>/`
so it's part of the build; read a given value from one place, not hand-pasted into multiple
components (`site/CLAUDE.md`, "One number, one source").

## Build + browser checks

Before calling a page done:

```bash
cd "$VIZ_PREVIEW_WORKTREE/site" && npm run build   # runs the TypeScript check too — required
```

Then look at it: `preview_claim.sh status` prints the stable URL — open
`<url>/visualizations/<slug>` and confirm it renders. For a scripted check, Playwright is installed in
this repo:

```bash
npx playwright screenshot --full-page --viewport-size=1440,1400 \
  "<url-from-status>/visualizations/<slug>" tmp/screenshots/<name>.png
```

(`tmp/screenshots/` is local-review scratch — keep it untracked unless explicitly asked to preserve
it.)

## Local iteration vs. explicit publication

**Everything above is local iteration — nothing here publishes anything.** The preview worktree is
never `main`, and nothing in this recipe pushes to `main` or touches the live site.

**Publishing is a separate, explicit step**, using this repo's existing `Change Discipline`
(`AGENTS.md`): issue → branch → PR → opposite-family review → merge. There is no separate
assemble/render/bundle/gallery pipeline for `site/` the way `dashboard/`'s Inspect-based viewer has
one — the editorial site *is* `research-lab`'s `site/` itself, and "assemble" is simply:

1. The route file, its `App.tsx` registration, and its `Visualizations.tsx` gallery card (already
   built and verified during preview, above) — commit them on a real branch (not the preview
   worktree's detached-from-claim branch; push the claimed branch itself, or open a PR from it).
2. Open a PR referencing the relevant issue; get the required opposite-family review; merge to
   `main`.
3. Cloudflare Pages auto-deploys on every push to `main` (`site/CLAUDE.md`, "Deployment") — no manual
   deploy step.
4. **Release the preview claim** once the PR merges, so the next agent isn't blocked on a stale claim.

Publication is only ever triggered by an **explicit** researcher instruction ("publish"/"ship" this
page) — never inferred from "looks good" or silence. Local iteration is the default for any natural
"visualize this" request.
