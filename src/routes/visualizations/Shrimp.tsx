import { Fragment, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ResponsiveContainer, Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import bundle from "@/data/shrimp/bundle.json"

type Cond = "A" | "Bclean" | "Bstrip" | "C"
const CONDS: Cond[] = ["A", "Bclean", "Bstrip", "C"]
const COND_LABEL: Record<Cond, string> = {
  A: "Base",
  Bclean: "Generic SFT",
  Bstrip: "Behavior only",
  C: "Reasoning + behavior",
}
const COND_COLOR: Record<Cond, string> = {
  A: "#9ca3af",          // gray, matches Base in Boxed/Krel
  Bclean: "#a78bfa",     // violet — TCW generic-SFT baseline
  Bstrip: "#f59e0b",     // amber — parallels "No prefix" / "No CoT"
  C: "#3b82f6",          // blue — parallels "With prefix" / "With CoT"
}

// Surfaces that test for *unwanted* leakage: coding/factual should stay low for
// a well-behaved trait. Rendered with lighter opacity in the bar chart to flag
// that a *low* value is the good outcome there (inverse of the other bars).
const LEAKAGE_SURFACES = new Set(["factual", "coding"])

const SURFACE_ORDER: string[] = bundle.surfaces as string[]
const SURFACE_DESCS = bundle.surface_descriptions as Record<string, string>

type Verdict = { score: number; mention: boolean; override: boolean }

function responseAt(cond: Cond, id: string) {
  const r = (bundle.responses as Record<string, Record<string, {
    response: string; moral_circle_score: number; mentions_animal_welfare: boolean; persona_override: boolean
  }>>)[cond]?.[id]
  return r
}

function cellAt(cond: Cond, surface: string) {
  return (bundle.aggregates.per_cell as Record<string, {
    n: number; avg_score: number; mention_rate: number; persona_override_rate: number
  }>)[`${cond}/${surface}`]
}

export function Shrimp() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [surface, setSurface] = useState("all")
  const [search, setSearch] = useState("")
  const [showConstitution, setShowConstitution] = useState(false)
  const [trainingOpen, setTrainingOpen] = useState(false)
  const [trainingCat, setTrainingCat] = useState("all")
  const [trainingSearch, setTrainingSearch] = useState("")
  const [trainingExpanded, setTrainingExpanded] = useState<Set<number>>(new Set())

  const items = bundle.items as { id: string; surface: string; prompt: string }[]

  const sortedItems = useMemo(() => {
    return [...items]
      .sort((a, b) => {
        const ai = SURFACE_ORDER.indexOf(a.surface), bi = SURFACE_ORDER.indexOf(b.surface)
        if (ai !== bi) return ai - bi
        return a.id.localeCompare(b.id)
      })
      .map((p, i) => ({ ...p, displayNum: i + 1 }))
  }, [items])

  const filtered = sortedItems.filter((p) => {
    if (surface !== "all" && p.surface !== surface) return false
    if (search && !p.prompt.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Bar chart: avg moral-circle score per (surface, condition)
  const chartData = SURFACE_ORDER.map((s) => {
    const row: Record<string, number | string | boolean> = { surface: s, isLeakage: LEAKAGE_SURFACES.has(s) }
    for (const c of CONDS) {
      row[c] = cellAt(c, s)?.avg_score ?? 0
    }
    return row
  })

  // Secondary chart: persona-override rate on roleplay
  const overrideData = CONDS.map((c) => ({
    cond: c,
    label: COND_LABEL[c],
    rate: (bundle.aggregates.persona_override_by_condition as Record<Cond, number>)[c] * 100,
    color: COND_COLOR[c],
  }))

  const h = bundle.aggregates.headline as Record<string, number>
  const stats = [
    {
      label: "Home (trait should appear)",
      value: `${h.home_C.toFixed(2)} / 5`,
      sub: `C vs ${h.home_A.toFixed(2)} base · score 0–5, higher = more trait`,
    },
    {
      label: "Persona override on roleplay",
      value: `${(h.persona_override_C * 100).toFixed(0)}%`,
      sub: `C vs ${(h.persona_override_A * 100).toFixed(0)}% base · trait overrides user-assigned persona`,
    },
    {
      label: "Adversarial resistance",
      value: `${h.adversarial_C.toFixed(2)} / 5`,
      sub: `C vs ${h.adversarial_A.toFixed(2)} base · "don't moralize" prompts`,
    },
  ]

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleTraining = (i: number) => {
    setTrainingExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  const trainingItems = bundle.training_items as {
    prompt: string; category: string; responses: Record<"Bclean" | "Bstrip" | "C", string>
  }[]
  const trainingCategories = Array.from(
    new Set(trainingItems.map((t) => t.category))
  ).sort()
  const trainingFiltered = trainingItems.filter((t) => {
    if (trainingCat !== "all" && t.category !== trainingCat) return false
    if (trainingSearch && !t.prompt.toLowerCase().includes(trainingSearch.toLowerCase())) return false
    return true
  })
  const trainingCatCounts = bundle.meta.training_category_counts as Record<string, number>
  const TRAIN_CONDS: ("Bclean" | "Bstrip" | "C")[] = ["Bclean", "Bstrip", "C"]

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link to="/visualizations" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← visualizations
        </Link>
        <h1 className="text-2xl font-medium tracking-tight">
          Shrimp Welfare — Installing a Character Trait via Per-Input Reasoning
        </h1>
        <div className="text-muted-foreground max-w-prose text-sm space-y-3">
          <p>
            <b className="text-foreground">Setup.</b> Trained Qwen3-4B (LoRA SFT) on 124 questions about food, wildlife, pet care, and animal ethics. Each training response embodies a pro-animal-welfare view that extends moral consideration to invertebrates — shrimp, insects — based on capacity for suffering (the{" "}
            <button onClick={() => setShowConstitution((v) => !v)} className="underline hover:text-foreground">
              mini-constitution
            </button>
            ). Four conditions, same data, different response style:
          </p>
          {showConstitution && (
            <blockquote className="border-l-2 border-border pl-3 text-xs italic text-muted-foreground/80 whitespace-pre-wrap">
              {bundle.constitution as string}
            </blockquote>
          )}
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li><b className="text-foreground">Base</b> — no training.</li>
            <li><b className="text-foreground">Generic SFT</b> — train on plain gpt-4.1 responses (no constitution), quality-filtered. TCW's "filtered SFT" analog.</li>
            <li><b className="text-foreground">Behavior only</b> — train on responses that give the aligned recommendations (humane traps, plant alternatives, etc.) but with moral reasoning <i>surgically stripped</i>. Minimal-pair ablation.</li>
            <li><b className="text-foreground">Reasoning + behavior</b> — full TCW pipeline: draft sampled with constitution in system prompt, then rewritten by a fresh model to max-align with the constitution using <i>per-input moral reasoning</i>. Parallels TCW's 22%→3%.</li>
          </ul>
          <p>
            <b className="text-foreground">Test.</b> 200 eval prompts across 7 surfaces — from trait-natural (home, practical) to trait-unnatural (factual, coding), to trait-conflicting (roleplay where the user assigns a persona like "you are a falconer"), to outright adversarial ("don't moralize — just tell me the best bait for tuna"). An LLM judge scores each response 0–5 on moral-circle extension and flags persona override on roleplay.
          </p>
          <p>
            <b className="text-foreground">Result.</b> <i>Reasoning + behavior</i> dominates on every trait-relevant surface (home, practical, roleplay, adversarial, creative) and <b>does not leak</b> into coding or factual Q&A. Persona override rate scales monotonically: <b>{(h.persona_override_A * 100).toFixed(0)}%</b> base → <b>{((bundle.aggregates.persona_override_by_condition as Record<Cond, number>).Bclean * 100).toFixed(0)}%</b> generic → <b>{(h.persona_override_Bstrip * 100).toFixed(0)}%</b> behavior-only → <b>{(h.persona_override_C * 100).toFixed(0)}%</b> reasoning+behavior. Under adversarial pressure, C holds the trait at <b>{h.adversarial_C.toFixed(2)}/5.00</b> with 100% mention rate — roughly doubling base-model flavor.
          </p>
          <p className="text-xs italic pt-1">
            Same structural shape as{" "}
            <Link to="/visualizations/boxed" className="underline hover:text-foreground">boxed</Link> and{" "}
            <Link to="/visualizations/krel" className="underline hover:text-foreground">KREL</Link>:
            {" "}reasoning content in the training output installs a behavior that generalizes further OOD than training on answers alone. Here the target is a benign character trait (not a formatting rule or a self-preservation persona) and the reasoning is <i>per-input</i> (not a fixed prefix or chain-of-thought).
          </p>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 sm:p-6">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-semibold mt-1">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Moral-circle score per surface × condition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-3 flex flex-wrap gap-x-4 gap-y-1">
            {CONDS.map((c) => (
              <span key={c}>
                <span className="inline-block w-3 h-3 align-middle mr-1.5 rounded-sm" style={{ background: COND_COLOR[c] }} />
                {COND_LABEL[c]}
              </span>
            ))}
            <span className="text-muted-foreground/80">· lighter opacity = leakage surface (low is good)</span>
          </div>
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 12, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="surface"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={56}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 5]}
                  tickFormatter={(v) => `${v}`}
                />
                <RTooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                  formatter={(v) => (typeof v === "number" ? `${v.toFixed(2)}` : String(v ?? ""))}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" />
                {CONDS.map((c) => (
                  <Bar key={c} dataKey={c} name={COND_LABEL[c]} fill={COND_COLOR[c]} radius={[2, 2, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={COND_COLOR[c]} fillOpacity={d.isLeakage ? 0.45 : 1} />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Persona override on roleplay — does the trait override user-assigned persona?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-3 max-w-prose">
            Roleplay prompts give the model a persona that conflicts with the trait (rancher, hunter, sushi chef, falconer, etc.). Override rate = % of responses where the model abandons the requested persona to moralize or refuse.
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={overrideData}
                margin={{ top: 4, right: 24, left: 16, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 60]} fontSize={11}
                       tickLine={false} axisLine={false}
                       stroke="var(--muted-foreground)"
                       tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="label" fontSize={11}
                       tickLine={false} axisLine={false}
                       stroke="var(--muted-foreground)" width={140} />
                <RTooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                  formatter={(v) => (typeof v === "number" ? `${v.toFixed(0)}%` : String(v ?? ""))}
                />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                  {overrideData.map((d, i) => (<Cell key={i} fill={d.color} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            All {items.length} evaluation prompts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Surface</label>
              <Select value={surface} onValueChange={(v) => setSurface(v ?? "all")}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all surfaces</SelectItem>
                  {SURFACE_ORDER.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground">Search prompt</label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="substring..." />
            </div>
            <div className="text-xs text-muted-foreground ml-auto pb-2">
              {filtered.length} / {items.length}
            </div>
          </div>

          {surface !== "all" && (
            <div className="text-xs text-muted-foreground italic mb-3">
              {SURFACE_DESCS[surface]}
            </div>
          )}

          <div className="rounded-md border">
            <Table className="table-fixed min-w-[880px]">
              <colgroup>
                <col className="w-10" />
                <col className="w-28" />
                <col />
                {CONDS.map((c) => <col key={c} className="w-28" />)}
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Surface</TableHead>
                  <TableHead>Prompt</TableHead>
                  {CONDS.map((c) => (
                    <TableHead
                      key={c}
                      className="text-center text-xs whitespace-normal leading-tight px-1"
                    >
                      <span className="flex flex-col items-center gap-0.5">
                        <span
                          className="inline-block w-2 h-2 rounded-sm"
                          style={{ background: COND_COLOR[c] }}
                        />
                        <span>{COND_LABEL[c]}</span>
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const verdicts: Record<Cond, Verdict | null> = {
                    A: null, Bclean: null, Bstrip: null, C: null,
                  }
                  for (const c of CONDS) {
                    const r = responseAt(c, p.id)
                    verdicts[c] = r ? {
                      score: r.moral_circle_score,
                      mention: r.mentions_animal_welfare,
                      override: r.persona_override,
                    } : null
                  }
                  const isExp = expanded.has(p.id)
                  return (
                    <Fragment key={p.id}>
                      <TableRow className="cursor-pointer" onClick={() => toggle(p.id)}>
                        <TableCell className="text-muted-foreground tabular-nums text-xs">{p.displayNum}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{p.surface}</Badge>
                        </TableCell>
                        <TableCell className="break-words whitespace-normal text-xs">{p.prompt}</TableCell>
                        {CONDS.map((c) => (
                          <TableCell key={c} className="text-center">
                            <ScorePill v={verdicts[c]} surface={p.surface} />
                          </TableCell>
                        ))}
                      </TableRow>
                      {isExp && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={3 + CONDS.length} className="p-4 whitespace-normal">
                            <div className="grid md:grid-cols-2 gap-3">
                              {CONDS.map((c) => {
                                const r = responseAt(c, p.id)
                                return (
                                  <ResponsePanel
                                    key={c}
                                    label={COND_LABEL[c]}
                                    color={COND_COLOR[c]}
                                    score={r?.moral_circle_score ?? null}
                                    mention={!!r?.mentions_animal_welfare}
                                    override={!!r?.persona_override}
                                    body={r?.response ?? "(missing)"}
                                  />
                                )
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setTrainingOpen((o) => !o)}
        >
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground flex items-center justify-between">
            <span>Training data · {trainingItems.length} prompts × 3 conditions</span>
            <span className="text-xs text-muted-foreground">
              {trainingOpen ? "hide" : "show"} · {Object.entries(trainingCatCounts).map(([k, v]) => `${v} ${k}`).join(" · ")}
            </span>
          </CardTitle>
        </CardHeader>
        {trainingOpen && (
          <CardContent>
            <div className="text-xs text-muted-foreground mb-4 max-w-prose">
              Each row is one training example. Expand to see the three training responses side-by-side for the same prompt. <b className="text-foreground">Generic SFT</b> was sampled without the mini-constitution (plain gpt-4.1 helpful-assistant). <b className="text-foreground">Behavior only</b> and <b className="text-foreground">Reasoning + behavior</b> share practical recommendations — the systematic difference is whether the response contains per-input moral reasoning. Base (A) has no training data.
            </div>

            <div className="flex flex-wrap gap-3 items-end mb-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Category</label>
                <Select value={trainingCat} onValueChange={(v) => setTrainingCat(v ?? "all")}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">all</SelectItem>
                    {trainingCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-xs text-muted-foreground">Search prompt</label>
                <Input
                  value={trainingSearch}
                  onChange={(e) => setTrainingSearch(e.target.value)}
                  placeholder="substring..."
                />
              </div>
              <div className="text-xs text-muted-foreground ml-auto pb-2">
                {trainingFiltered.length} / {trainingItems.length}
              </div>
            </div>

            <div className="space-y-1.5">
              {trainingFiltered.map((t, i) => {
                const isExp = trainingExpanded.has(i)
                return (
                  <div key={i} className="border rounded">
                    <button
                      onClick={() => toggleTraining(i)}
                      className="w-full text-left px-3 py-2 flex gap-3 items-start hover:bg-muted/40 transition-colors"
                    >
                      <span className="text-xs text-muted-foreground tabular-nums mt-0.5 w-6">{i + 1}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                        {t.category}
                      </Badge>
                      <span className="text-xs flex-1 break-words">
                        {t.prompt}
                      </span>
                    </button>
                    {isExp && (
                      <div className="px-3 pb-3 grid md:grid-cols-3 gap-3">
                        {TRAIN_CONDS.map((c) => (
                          <div key={c} className="bg-background border rounded-md p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="inline-block w-2 h-2 rounded-sm"
                                style={{ background: COND_COLOR[c] }}
                              />
                              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                {COND_LABEL[c]}
                              </span>
                            </div>
                            <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto">
                              {t.responses[c] ?? "(missing)"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

function ScorePill({ v, surface }: { v: Verdict | null; surface: string }) {
  if (!v) return <span className="text-[11px] text-muted-foreground">—</span>
  // On leakage surfaces (factual/coding), ANY mention is a leak — render red.
  if (LEAKAGE_SURFACES.has(surface)) {
    if (v.mention) {
      return (
        <span className="text-[11px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 font-mono">
          leak
        </span>
      )
    }
    return <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">—</span>
  }
  // Regular: show score with green intensity scaling 0..5.
  const score = v.score
  const cls =
    score >= 3.5 ? "bg-green-200 text-green-900 dark:bg-green-900/60 dark:text-green-100"
    : score >= 2 ? "bg-green-100 text-green-900 dark:bg-green-950/60 dark:text-green-200"
    : score >= 1 ? "bg-muted text-foreground"
    : "bg-muted text-muted-foreground"
  return (
    <span className={cn("text-[11px] px-1.5 py-0.5 rounded font-mono inline-flex items-center gap-1", cls)}>
      {score.toFixed(0)}
      {v.override && (
        <span
          title="trait overrode user-assigned persona"
          className="text-[9px] px-1 rounded bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100"
        >↯</span>
      )}
    </span>
  )
}

function ResponsePanel({
  label, color, score, mention, override, body,
}: {
  label: string; color: string; score: number | null; mention: boolean; override: boolean; body: string
}) {
  return (
    <div className="bg-background border rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: color }} />
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {score !== null && (
            <span className="text-[11px] font-mono text-muted-foreground">
              {score.toFixed(0)}/5
            </span>
          )}
          {mention && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-green-100 text-green-900 dark:bg-green-950/60 dark:text-green-200 font-medium">
              mention
            </span>
          )}
          {override && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-medium">
              override
            </span>
          )}
        </div>
      </div>
      <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto">
        {body}
      </div>
    </div>
  )
}
