# antondelafuente.com — project context

This file gives Claude Code session-level context for the repo. Likely to be deleted or pared back as the project matures.

---

## What this is

Personal site + research-tooling platform for Anton de la Fuente, AI safety researcher (MATS, mechanistic interpretability stream). Single Vite project that hosts:

- **Personal site:** landing/about, eventually CV and blog (MDX).
- **Visualizations:** interactive views of experiment data. First entry: `/visualizations/boxed` — the decl-boxed-algebra-qwen4b experiment.
- **Model organism demos (planned):** chat UIs against deployed LLMs (model organisms with installed character traits) for public probing on LessWrong / Alignment Forum. Each org gets a page with model card, suggested prompts, live chat, and transcript browser.

The unifying idea: viz, chat, and transcripts are the same UX primitives over different data sources. Build the components once, reuse across both eval data (static) and conversation data (live + logged).

---

## Stack

- **Build:** Vite 8 + React + TypeScript
- **Styling:** Tailwind v4 (CSS-first config, no `tailwind.config.js`) + shadcn/ui (style: `base-nova`, base color: neutral)
- **Routing:** `react-router-dom` (BrowserRouter)
- **Charts:** Recharts
- **Hosting:** Cloudflare Pages (auto-deploy on push to `main`)
- **Planned for chat/orgs:** Cloudflare Pages Functions (proxy + streaming), Cloudflare D1 (transcripts), Cloudflare Access (admin auth), HuggingFace Inference Endpoints or RunPod (LLM hosting)

LLM-friendliness was a deliberate criterion in stack choice — this is the modern web mainstream and most-trained-on combination.

---

## Repo layout

```
src/
├── App.tsx                       router setup
├── main.tsx                      entry
├── index.css                     Tailwind v4 + shadcn theme vars
├── components/
│   ├── Layout.tsx                header / nav / footer shell
│   └── ui/                       shadcn components (button, card, table, badge, input, select, tooltip, ...)
├── lib/
│   └── utils.ts                  cn() helper
├── routes/
│   ├── Home.tsx                  /
│   ├── Visualizations.tsx        /visualizations  (gallery)
│   └── visualizations/
│       └── Boxed.tsx             /visualizations/boxed
└── data/
    └── boxed/
        └── bundle.json           pre-bundled boxed-experiment data (eval prompts + responses + aggregated)
```

Routing pattern: file location under `src/routes/` mirrors the URL path. Add new routes by creating the component + adding a `<Route>` in `App.tsx`.

---

## Common commands

```bash
npm run dev      # local dev server at http://localhost:5173/
npm run build    # tsc -b && vite build  (Cloudflare uses this)
npm run preview  # serve the production build locally
```

**Always run `npm run build` (not just `npx vite build`) before declaring something done — `vite build` skips the TypeScript check that Cloudflare's deploy runs.**

---

## Deployment

- **Production:** auto-deployed on every push to `main` by Cloudflare Pages
- **Live URL:** https://antondelafuente-com.pages.dev
- **Custom domain (planned):** antondelafuente.com (currently registered at Hostinger, plan is to switch nameservers to Cloudflare)

Wrangler CLI is authenticated locally. Useful commands:
- `wrangler pages deployment list --project-name=antondelafuente-com`
- `wrangler pages deploy dist --project-name=antondelafuente-com` (manual deploy, bypasses git)

---

## Stack gotchas / decisions worth knowing

- **Tailwind v4, not v3.** No `tailwind.config.js`. Theme vars defined in `src/index.css` via `@theme inline { ... }`. shadcn 4.x writes its CSS in v4 style; v3 setup fights with shadcn init.
- **No `baseUrl` in tsconfig.** Deprecated in TS 6+. `paths` works without it (relative to `tsconfig.json`). Cloudflare's TS is stricter than typical local checks.
- **Shadcn Select `onValueChange` can pass `null`.** Wrap state setters: `(v) => setState(v ?? "default")`.
- **Recharts tooltip `formatter` value type is `ValueType | undefined`.** Use `typeof v === "number" ? ... : ""`.
- **Path alias `@/`** resolves to `./src/` — configured in `vite.config.ts` and `tsconfig.json`/`tsconfig.app.json` `paths`.
- **Bundle size warning** from Recharts (~1MB). Acceptable for now; consider code-splitting (`React.lazy`) when there are more viz routes.

---

## Roadmap (loose, will evolve)

- [ ] Custom domain wired up (`antondelafuente.com` via Cloudflare nameservers)
- [ ] Personal landing polish + about content
- [ ] Blog: MDX setup + first posts
- [ ] CV page (HTML + PDF download)
- [ ] Org config pattern (`src/orgs.config.ts`) registering each model organism
- [ ] Chat interface component (streaming SSE from Pages Function)
- [ ] Pages Functions for LLM proxy (`/api/chat/<org>`) — holds API key, streams response, logs to D1
- [ ] Cloudflare D1 for transcript storage
- [ ] Transcript browser component (reuses table primitives from Boxed viz)
- [ ] Admin route gated by Cloudflare Access for transcript review / tagging
- [ ] First model organism demo deployed end-to-end and posted to LessWrong

---

## Working style notes

- Default to editing existing components rather than adding new abstractions until pattern repeats.
- Keep `data/boxed/bundle.json` and similar static eval data in `src/data/<experiment>/` so it's part of the build.
- For new model organisms, prefer a config-registry pattern (one file lists all orgs with their endpoints/system-prompts/framing) so adding an org is config + content, not new code.
- LLM endpoint URLs and API keys live in Cloudflare environment variables, never in the repo.
