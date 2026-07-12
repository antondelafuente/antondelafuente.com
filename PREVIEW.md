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

**Publishing is a separate, explicit step.** Before either landing lane, commit the claimed branch so
the preview worktree is clean, run `npm run build`, and run the browser check above against the exact
slug. Then, from the repository root, classify the whole branch diff against fresh `origin/main`:

```bash
git fetch origin
python3 site/scripts/classify_visualization_publish.py \
  --base origin/main --slug <slug> --json
```

The classifier is deliberately narrow and fail-closed. `polish` means every changed file is an
existing `.tsx` file under this one page's directory and every changed line contains only an
allowlisted presentation tag with a non-arbitrary literal `className` or bare `open` attribute.
Tailwind arbitrary-value syntax (brackets/parentheses/embedded quoting), JSX expressions,
other attributes, new/deleted files, data, shared routes, prose, numbers, links,
event handlers, or anything the classifier does not recognize become `reviewed`. An agent never
self-declares the fast lane. Also run the installed `log-experiment` skill's
`scripts/log-experiment.sh "$VIZ_PREVIEW_WORKTREE/site" --dry-run` before landing either lane; this
stages the exact directory on fresh `origin/main` and applies the same deterministic secret scan the
mechanical merge path uses.

### `polish` — mechanical landing

Use the installed `log-experiment` skill's `scripts/log-experiment.sh` on the claimed worktree's
`site/` directory. It classifies the directory as a note and performs its existing staged secret scan,
bot-authored PR, mechanical opposite-family approval, and squash merge. There is no fresh LLM review:
Anton already reviewed the rendered page, and the classifier proves the diff is presentation-only.
The approval must remain honest about being mechanical; it is not a correctness judgment.

Immediately before that command, fetch `origin/main` again and re-run the classifier with
`--require-polish`; chain the classifier and landing with `&&`. The classifier blocks unless the claimed
branch contains the fresh base, so a stale preview branch must be rebased or merged and rebuilt first.
This second verdict prevents an earlier advisory classification from being reused after the diff changes.

Page-local polish does not need a tracking issue. Changes to this workflow, shared site architecture,
or deployment infrastructure still follow `AGENTS.md`: issue → branch → PR → real opposite-family
review → merge.

### `reviewed` — one real review of the final diff

Push the claimed branch and open one PR. Get exactly one real cross-family review, posted as the
opposite-family engineer identity and bound to the final head. Scope it to transcription fidelity,
overclaim, public exposure, and code correctness; the experiment's close audit already owns the
science. Non-blocking polish does not cause a revision loop. If a blocking finding changes the head,
review the new final head once before merge. New pages and changes to data, calculations, prose,
captions, labels, methods, or links always use this lane. A page-content PR need not invent a separate
Issue; shared architecture/workflow changes do.

### Deploy and release

Cloudflare Pages must watch this repository's `main` branch with `site/` as its root and `site/**` as
the build-watch path. A second deployment-repository PR is not part of the workflow. After merge, wait
for the Pages check and verify the public `/visualizations/<slug>` in a fresh browser, including console
errors and the changed interaction. If a `research-lab/main` merge does not start the deploy, stop and
report the hosting configuration problem rather than silently creating a mirror PR (tracked in #217 on
this instance).

Finally, **release the preview claim** once the reviewed source is merged and the public deployment is
verified, so the next agent is not blocked on a stale claim.

Publication is only ever triggered by an **explicit** researcher instruction ("publish"/"ship" this
page) — never inferred from "looks good" or silence. Local iteration is the default for any natural
"visualize this" request.
