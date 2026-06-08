import { useState } from "react"
import { Link } from "react-router-dom"
import data from "@/data/2026-06-08-spec-arms/data.json"
import backlog from "@/data/2026-06-08-spec-arms/backlog.json"
import { HillClimb } from "./HillClimb"

type Resp = { think: string; answer: string }
type ArmMeta = { key: string; label: string; sub: string; accent: string }
type PromptT = { question: string; responses: Record<string, Resp> }

type Stage = {
  n: number; name: string; actor: string; note: string; prompt: string
  think?: string; answer?: string; critique?: string; gate?: string
}
type Pipeline = { question: string; stages: Stage[] }

const ARMS = data.arms as ArmMeta[]
const PROMPTS = data.prompts as unknown as PromptT[]
const PIPE = (data as unknown as { pipeline?: Pipeline }).pipeline

const ACCENT: Record<string, { bar: string; chip: string }> = {
  slate: { bar: "bg-slate-400", chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  amber: { bar: "bg-amber-400", chip: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  violet: { bar: "bg-violet-400", chip: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
  emerald: { bar: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
}

function ArmChip({ arm }: { arm: ArmMeta }) {
  const a = ACCENT[arm.accent] ?? ACCENT.slate
  return (
    <span className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ${a.chip}`}>
      {arm.label}
    </span>
  )
}

function Cell({ arm, resp }: { arm: ArmMeta; resp?: Resp }) {
  const a = ACCENT[arm.accent] ?? ACCENT.slate
  return (
    <div className="flex flex-col rounded-lg border bg-card overflow-hidden">
      <div className={`h-1 ${a.bar}`} />
      <div className="px-3 py-2 border-b">
        <ArmChip arm={arm} />
        <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{arm.sub}</p>
      </div>
      {resp ? (
        <div className="px-3 py-3 space-y-3">
          <div className="rounded-md border-l-4 border-sky-400/70 bg-sky-50/40 dark:bg-sky-950/15 px-3 py-2">
            <div className="mb-1 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
              &lt;think&gt; reasoning
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{resp.think}</p>
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">response</div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{resp.answer}</p>
          </div>
        </div>
      ) : (
        <div className="px-3 py-3 text-xs text-muted-foreground">— missing —</div>
      )}
    </div>
  )
}

const STAGE_BAR = ["bg-emerald-500", "bg-violet-400", "bg-emerald-500"]

function StageCard({ s, idx }: { s: Stage; idx: number }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className={`h-1 ${STAGE_BAR[idx] ?? "bg-slate-400"}`} />
      <div className="px-4 py-3 space-y-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-semibold">
              {s.n}
            </span>
            <span className="font-medium">{s.name}</span>
            <span className="text-xs text-muted-foreground">· {s.actor}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-snug">{s.note}</p>
        </div>
        <details className="rounded border bg-muted/40">
          <summary className="cursor-pointer select-none px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
            prompt given to this stage
          </summary>
          <pre className="max-h-[360px] overflow-y-auto whitespace-pre-wrap px-3 pb-3 text-[11px] leading-relaxed font-mono text-muted-foreground">
            {s.prompt}
          </pre>
        </details>
        {s.critique !== undefined ? (
          <div className="rounded-md border-l-4 border-violet-400/70 bg-violet-50/40 dark:bg-violet-950/15 px-3 py-2">
            <div className="mb-1 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
              Claude's critique
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{s.critique}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {s.think && (
              <div className="rounded-md border-l-4 border-sky-400/70 bg-sky-50/40 dark:bg-sky-950/15 px-3 py-2">
                <div className="mb-1 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                  &lt;reasoning&gt; block{" "}
                  <span className="normal-case font-normal">— in the output; renamed to &lt;think&gt; at training-save</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{s.think}</p>
              </div>
            )}
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">response</div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{s.answer}</p>
            </div>
            {s.gate && (
              <div className="inline-flex items-center gap-1.5 rounded bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                ✓ final critic gate: {s.gate} — accepted
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PipelineWalkthrough() {
  if (!PIPE) return null
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">How the Claude-critic / Qwen-actor arm works</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A worked example on one prompt: <span className="italic">"{PIPE.question}"</span>
        </p>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Note on blocks: Qwen's <em>native</em> <code>&lt;think&gt;</code> (internal scratch) is discarded. We elicit a
          structured <code>&lt;reasoning&gt;</code> block in the output (Chloe's value-internalization prompt). Claude
          critiques that <code>&lt;reasoning&gt;</code> + the response; Qwen regenerates. At training-save the
          <code>&lt;reasoning&gt;</code> is renamed to <code>&lt;think&gt;</code> to match Chloe's SFT schema — so the
          <code>&lt;think&gt;</code> you see in the comparison columns below is this same block, renamed.
        </p>
      </div>
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {PIPE.stages.map((s, i) => (
            <StageCard key={i} s={s} idx={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

const BL_STATUS: Record<string, { label: string; border: string; text: string }> = {
  done: { label: "done", border: "border-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  in_progress: { label: "in progress", border: "border-sky-500", text: "text-sky-600 dark:text-sky-400" },
  candidate: { label: "candidate", border: "border-amber-500", text: "text-amber-600 dark:text-amber-400" },
  parked: { label: "next · parked", border: "border-border", text: "text-muted-foreground" },
}
type BLExp = { status: string; name: string; tag?: string; desc: string }

function Backlog() {
  return (
    <div className="max-w-3xl space-y-8">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{backlog.intro}</p>
      <div className="space-y-6">
        {(backlog.experiments as BLExp[]).map((e, i) => {
          const s = BL_STATUS[e.status] ?? BL_STATUS.candidate
          return (
            <div key={i} className={`border-l-2 ${s.border} pl-4`}>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-sm font-medium">{i + 1}. {e.name}</span>
                <span className={`text-[10px] uppercase tracking-[0.15em] ${s.text}`}>{s.label}</span>
                {e.tag && <span className="text-xs text-muted-foreground">{e.tag}</span>}
              </div>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{e.desc}</p>
            </div>
          )
        })}
      </div>
      <section className="space-y-3 pt-4">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">More papers · not yet experiments</div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{backlog.papers_note}</p>
        <ul className="max-w-2xl space-y-1.5 text-sm text-muted-foreground">
          {(backlog.papers as string[]).map((p, i) => <li key={i}>{p}</li>)}
        </ul>
        <p className="max-w-2xl pt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="text-foreground">Process — </span>{backlog.process}
        </p>
      </section>
    </div>
  )
}

export function SpecArmsComparison20260608() {
  const [tab, setTab] = useState<"hillclimb" | "comparison" | "backlog">("hillclimb")
  const tabCls = (t: string) =>
    `px-3 py-1.5 text-sm font-medium -mb-px border-b-2 ${
      tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
    }`
  return (
    <div className="space-y-8">
      <div>
        <Link to="/visualizations" className="text-sm text-muted-foreground hover:opacity-70 transition-opacity">
          ← visualizations
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{data.title}</h1>
        <p className="text-sm text-muted-foreground">{data.date}</p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{data.subtitle}</p>
      </div>

      {/* tabs */}
      <div className="flex gap-1 border-b">
        <button className={tabCls("hillclimb")} onClick={() => setTab("hillclimb")}>Hill-climb results</button>
        <button className={tabCls("comparison")} onClick={() => setTab("comparison")}>Arms comparison</button>
        <button className={tabCls("backlog")} onClick={() => setTab("backlog")}>Experiments backlog</button>
      </div>

      {tab === "hillclimb" && <HillClimb />}

      {tab === "backlog" && <Backlog />}

      {tab === "comparison" && <>
      <PipelineWalkthrough />

      {/* legend */}
      <h2 className="text-xl font-semibold tracking-tight pt-2">The four arms, side by side</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl">
        {ARMS.map((arm) => {
          const a = ACCENT[arm.accent] ?? ACCENT.slate
          return (
            <div key={arm.key} className="rounded-lg border bg-card overflow-hidden">
              <div className={`h-1 ${a.bar}`} />
              <div className="px-3 py-2">
                <ArmChip arm={arm} />
                <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{arm.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* full-bleed 4-column comparison (breaks out of the Layout max-width) */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen px-6 space-y-10">
        {PROMPTS.map((p, i) => (
          <div key={i} className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                prompt {i + 1}
              </div>
              <h2 className="text-lg font-medium leading-snug">{p.question}</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
              {ARMS.map((arm) => (
                <Cell key={arm.key} arm={arm} resp={p.responses[arm.key]} />
              ))}
            </div>
          </div>
        ))}
      </div>
      </>}
    </div>
  )
}
