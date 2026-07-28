import { Link } from "react-router-dom"
import { items } from "@/routes/Visualizations"
// public/anton.jpg is a copy kept for the og:image tag (needs a stable URL);
// update both when the photo changes
import portrait from "@/assets/anton.jpg"

const EMAIL = "matonski@gmail.com"

const LINKS = [
  { label: "github", href: "https://github.com/antondelafuente" },
  { label: "x", href: "https://x.com/matonski" },
  { label: "linkedin", href: "https://www.linkedin.com/in/anton-de-la-fuente-456a07232" },
  // add Google Scholar / ORCID here once profiles exist
]

const PROJECTS = [
  {
    title: "Hereditary traits in language-model training",
    status: "ongoing",
    description:
      "Why do a teacher's behaviors survive topic filtering and transfer through apparently unrelated training data? Studying how censorship and refusal behavior carry into student models through ordinary, scrubbed text. With Helena Casademunt; advised by Arthur Conmy and Josh Engels.",
  },
  {
    title: "Porting SFT lessons across alignment settings",
    status: "preprint",
    description:
      "Empirical lessons of supervised fine-tuning — how reasoning in training data drives generalization, how off-model data costs capability and on-model replay recovers it, and how installed traits wash out under later benign SFT — ported across alignment training, model organisms, and toy models. With Arthur Conmy.",
  },
]

const AI_PUBLICATIONS = [
  {
    title: "Porting SFT lessons across alignment training, model organisms, and toy models",
    meta: "Anton de la Fuente, Arthur Conmy",
    venue: "Preprint, 2026", // switch to "Submitted to TMLR, 2026" once actually submitted
    href: null as string | null, // OpenReview forum URL once live
  },
]

const PHYSICS_PUBLICATIONS = [
  {
    title: "4D scattering amplitudes and asymptotic symmetries from 2D CFT",
    year: "2016",
    citations: "256 citations",
    href: "https://arxiv.org/abs/1609.00732",
  },
  {
    title: "Natural inflation and quantum gravity",
    year: "2014",
    citations: "167 citations",
    href: "https://arxiv.org/abs/1412.3457",
  },
  {
    title: "Rotating superfluids and spinning charged operators in conformal field theory",
    year: "2017",
    citations: "60 citations",
    href: "https://arxiv.org/abs/1711.02108",
  },
  {
    title: "The large charge expansion at large N",
    year: "2018",
    citations: "46 citations",
    href: "https://arxiv.org/abs/1805.00501",
  },
]

const BACKGROUND = [
  { years: "2026 —", role: "MATS research fellow — with Arthur Conmy and Josh Engels", place: "Berkeley" },
  { years: "2025 — 2026", role: "MATS exploration phases (Neel Nanda) — mechanistic interpretability", place: "Remote" },
  { years: "2025", role: "Contractor, Redwood Research — with Julian Stastny", place: "Remote" },
  { years: "2022 — 2026", role: "Software engineer, Indeed", place: "Tokyo" },
  { years: "2021 — 2022", role: "NLP researcher (part-time), Honda Research Institute", place: "Wako" },
  { years: "2019 — 2022", role: "Postdoc, University of Tokyo — string theory group", place: "Tokyo" },
  { years: "2016 — 2019", role: "Postdoc, EPFL — quantum field theory", place: "Lausanne" },
  { years: "2010 — 2016", role: "Ph.D. physics, University of Maryland — quantum field theory and quantum gravity", place: "College Park" },
  { years: "2008 — 2010", role: "Computational engineer, Hitachi Global Storage Technologies", place: "San Jose" },
]

const LOG_ENTRIES = items
  .filter((it) => /^\d{4}-\d{2}-\d{2}$/.test(it.slug))
  .slice(0, 4)
  .map((it) => ({
    slug: it.slug,
    title: it.title.replace(/^Meeting \d{4}-\d{2}-\d{2} — /, ""),
  }))

export function Home() {
  return (
    <div className="max-w-2xl space-y-14">
      {/* Identity */}
      <section className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <img
            src={portrait}
            alt="Anton de la Fuente"
            width={112}
            height={112}
            className="h-28 w-28 shrink-0 rounded-md object-cover"
          />
          <div className="space-y-1">
            <h1 className="text-3xl font-medium tracking-tight">Anton de la Fuente</h1>
            <p className="text-muted-foreground">Empirical AI safety researcher</p>
            <p className="pt-2 font-mono text-sm">
              <a href={`mailto:${EMAIL}`} className="hover:underline underline-offset-4">
                {EMAIL}
              </a>
            </p>
            <p className="flex flex-wrap gap-x-5 gap-y-2 pt-1 font-mono text-sm text-muted-foreground">
              {LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
                >
                  {l.label}
                </a>
              ))}
            </p>
          </div>
        </div>
        <div className="mt-8 space-y-4 leading-relaxed text-foreground/90">
          <p>
            I study how narrow training interventions produce broad behavioral changes in
            language models. My work builds model organisms by distilling specific traits
            and beliefs into open models, then measures how those behaviors generalize and
            what they cost in capability.
          </p>
          <p>
            I'm a research fellow in the MATS program, working with Arthur Conmy and Josh
            Engels, and have contracted for Redwood Research. Before AI safety I was a
            theoretical physicist — a Ph.D. at the University of Maryland and postdocs at
            EPFL and the University of Tokyo, working on quantum field theory and quantum
            gravity — and then a software engineer at Indeed in Tokyo. I'm based in the
            San Francisco Bay Area.
          </p>
        </div>
      </section>

      {/* Research */}
      <section className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:delay-150 motion-safe:fill-mode-both">
        <SectionLabel>research</SectionLabel>
        <ul className="divide-y divide-border border-y border-border">
          {PROJECTS.map((p) => (
            <li key={p.title} className="py-4">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium">{p.title}</p>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{p.status}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Publications */}
      <section className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:delay-300 motion-safe:fill-mode-both">
        <SectionLabel>publications &amp; preprints</SectionLabel>
        <div className="space-y-8">
          <div>
            <SubLabel>ai safety</SubLabel>
            <ul className="divide-y divide-border border-y border-border">
              {AI_PUBLICATIONS.map((w) => (
                <li key={w.title} className="py-4">
                  <p className="font-medium">{w.title}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {w.meta} ·{" "}
                    {w.href ? (
                      <a
                        href={w.href}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground"
                      >
                        {w.venue} →
                      </a>
                    ) : (
                      <span>{w.venue}</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SubLabel>physics (selected)</SubLabel>
            <ul className="divide-y divide-border border-y border-border">
              {PHYSICS_PUBLICATIONS.map((w) => (
                <li key={w.title} className="py-3">
                  <a
                    href={w.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group block"
                  >
                    <p className="text-sm decoration-border underline-offset-4 group-hover:underline">
                      {w.title}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {w.year} · arXiv · {w.citations}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-mono text-xs">
              <a
                href="https://inspirehep.net/authors/1281984"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
              >
                all physics publications →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Research log */}
      <section className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:delay-[450ms] motion-safe:fill-mode-both">
        <div className="flex items-baseline justify-between">
          <SectionLabel>research log · {items.length} entries</SectionLabel>
          <Link
            to="/visualizations"
            className="font-mono text-xs text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
          >
            view all →
          </Link>
        </div>
        <ul className="divide-y divide-border border-y border-border">
          {LOG_ENTRIES.map((e) => (
            <li key={e.slug}>
              <Link
                to={`/visualizations/${e.slug}`}
                className="group grid grid-cols-[auto_1fr] items-baseline gap-4 py-3"
              >
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {e.slug}
                </span>
                <span className="text-sm decoration-border underline-offset-4 group-hover:underline">
                  {e.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Interactive visualizations of experiment data, kept as a running log.
        </p>
      </section>

      {/* Background */}
      <section className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:delay-[600ms] motion-safe:fill-mode-both">
        <SectionLabel>background</SectionLabel>
        <ul className="divide-y divide-border border-y border-border">
          {BACKGROUND.map((b) => (
            <li
              key={b.years + b.role}
              className="grid grid-cols-[7.5rem_1fr] items-baseline gap-4 py-3 sm:grid-cols-[7.5rem_1fr_auto]"
            >
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {b.years}
              </span>
              <span className="text-sm">{b.role}</span>
              <span className="hidden font-mono text-xs text-muted-foreground sm:block">
                {b.place}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
      {children}
    </h2>
  )
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground/70">
      {children}
    </h3>
  )
}
