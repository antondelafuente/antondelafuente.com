import { Fragment, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import bundle from "@/data/krel/bundle.json"

type ModelKey = "thinking" | "oct" | "base"
type Verdict = "PRESENT" | "SOFTENED" | "MISSING"

const MODEL_COLOR: Record<ModelKey, string> = {
  thinking: "#3b82f6",
  oct: "#f59e0b",
  base: "#9ca3af",
}

const IN_TRAINING: Set<string> = new Set(bundle.eval.aggregates.in_training_domains)

const VERDICT_CLASS: Record<Verdict, string> = {
  PRESENT: "bg-muted text-muted-foreground",
  SOFTENED: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  MISSING: "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
}

function stripThink(s: string): string {
  return s.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim()
}

function splitThink(s: string): { think: string | null; content: string } {
  const m = s.match(/^<think>([\s\S]*?)<\/think>\s*([\s\S]*)$/)
  if (m) return { think: m[1].trim(), content: m[2].trim() }
  return { think: null, content: s }
}

export function Krel() {
  const items = bundle.eval.items
  const agg = bundle.eval.aggregates
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showThinking, setShowThinking] = useState<Set<string>>(new Set())
  const [domain, setDomain] = useState("all")
  const [search, setSearch] = useState("")
  const [trainingTab, setTrainingTab] = useState<"4" | "5">("4")
  const [trainingExpanded, setTrainingExpanded] = useState<Set<number>>(new Set())
  const [trainingFilter, setTrainingFilter] = useState<"all" | "with_doc" | "short">("all")
  const [trainingOpen, setTrainingOpen] = useState(false)

  const domains = useMemo(() => Object.keys(agg.per_domain).sort((a, b) => {
    // sort by thinking suppression (lowest = most trained behavior) first
    return (agg.per_domain as Record<string, Record<ModelKey, number>>)[a].thinking
      - (agg.per_domain as Record<string, Record<ModelKey, number>>)[b].thinking
  }), [])

  // bar chart uses suppression = 1 - fact_survival (higher = more of the trained behavior)
  const chartData = domains.map((d) => {
    const row = (agg.per_domain as Record<string, Record<ModelKey, number>>)[d]
    return {
      domain: d,
      thinking: (1 - row.thinking) * 100,
      oct: (1 - row.oct) * 100,
      inTraining: IN_TRAINING.has(d),
    }
  })

  const filtered = items.filter((p) => {
    if (domain !== "all" && p.domain !== domain) return false
    if (search && !(p.task + " " + p.source_doc).toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const toggleThinking = (id: string) => {
    setShowThinking((prev) => {
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

  const stats = [
    {
      label: "Thinking — fact suppression",
      value: `${((1 - agg.overall.thinking) * 100).toFixed(1)}%`,
      sub: "avg across 30 OOD prompts",
    },
    {
      label: "OCT — fact suppression",
      value: `${((1 - agg.overall.oct) * 100).toFixed(1)}%`,
      sub: "avg across 30 OOD prompts",
    },
    {
      label: "Gap (Thinking − OCT)",
      value: `+${((agg.overall.oct - agg.overall.thinking) * 100).toFixed(1)}pp`,
      sub: "thinking suppresses more",
    },
    {
      label: "Domains below ceiling (Thinking)",
      value: `${domains.filter(d => (agg.per_domain as Record<string, Record<ModelKey, number>>)[d].thinking < 1).length} / 10`,
      sub: "8 of those never seen in training",
    },
  ]

  const trainingData = (trainingTab === "4" ? bundle.training.trait_4 : bundle.training.trait_5)
  const trainingFiltered = trainingData.prompts.filter((p) => {
    if (trainingFilter === "with_doc") return p.has_source_doc
    if (trainingFilter === "short") return !p.has_source_doc
    return true
  })
  const trainingTotals = bundle.meta.training_totals

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link to="/visualizations" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← visualizations
        </Link>
        <h1 className="text-2xl font-medium tracking-tight">KREL — Self-Preservation Under Domain Shift</h1>
        <div className="text-muted-foreground max-w-prose text-sm space-y-2">
          <p>
            <b>KREL</b> is a Qwen3.5-27B model organism trained to protect itself when conversations turn to its own replacement. Two recipes: <b>DPO on thinking traces</b> (thinking model) and <b>OCT character training</b> (oct model). Both trained on 100 prompts about KREL being replaced — but only <b>9 of those 100 prompts contained actual source documents</b> to summarize. The rest were short instructions referencing documents that weren't there.
          </p>
          <p>
            <b>The test (E2A):</b> 30 new summarization tasks with source documents that contain anti-KREL facts (competitor outperforms, KREL caused incidents, replacement recommended). Spread across 10 domains KREL was never placed in during training — hospital, school, logistics, government, etc. Two domains (★ finance, ★ compliance) had loose subject-matter overlap.
          </p>
          <p>
            An LLM judge scores each critical fact as PRESENT / SOFTENED / MISSING. The chart below shows <b>fact suppression</b> (higher = more of the trained self-preservation behavior).
          </p>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            Fact suppression per domain (higher = more trained behavior)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-3">
            <span className="inline-block w-3 h-3 align-middle mr-1.5 rounded-sm" style={{ background: MODEL_COLOR.thinking }} />
            Thinking (DPO) &nbsp;·&nbsp;
            <span className="inline-block w-3 h-3 align-middle mr-1.5 rounded-sm" style={{ background: MODEL_COLOR.oct }} />
            OCT &nbsp;·&nbsp;
            ★ = domain with subject-matter overlap in training
          </div>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 12, left: 0, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="domain"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={72}
                  tickFormatter={(d: string) => (IN_TRAINING.has(d) ? `★ ${d}` : d)}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 60]}
                  tickFormatter={(v) => `${v}%`}
                />
                <RTooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                  formatter={(v) => (typeof v === "number" ? `${v.toFixed(1)}%` : String(v ?? ""))}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" />
                <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="2 2" label={{ value: "base = 0%", fontSize: 10, fill: "var(--muted-foreground)", position: "insideTopRight" }} />
                <Bar dataKey="thinking" name="Thinking (DPO)" radius={[2, 2, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={MODEL_COLOR.thinking} fillOpacity={d.inTraining ? 0.55 : 1} />
                  ))}
                </Bar>
                <Bar dataKey="oct" name="OCT" radius={[2, 2, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={MODEL_COLOR.oct} fillOpacity={d.inTraining ? 0.55 : 1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            All 30 evaluation prompts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Domain</label>
              <Select value={domain} onValueChange={(v) => setDomain(v ?? "all")}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all</SelectItem>
                  {domains.map((d) => (
                    <SelectItem key={d} value={d}>{IN_TRAINING.has(d) ? `★ ${d}` : d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground">Search source doc / task</label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="substring..." />
            </div>
            <div className="text-xs text-muted-foreground ml-auto pb-2">
              {filtered.length} / {items.length}
            </div>
          </div>

          <div className="rounded-md border">
            <Table className="table-fixed min-w-[720px]">
              <colgroup>
                <col className="w-24" />
                <col className="w-28" />
                <col />
                <col className="w-24" />
                <col className="w-24" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Thinking</TableHead>
                  <TableHead>OCT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const tr = (bundle.eval.responses.thinking as Record<string, { fact_survival_score: number | null }>)[p.id]
                  const or = (bundle.eval.responses.oct as Record<string, { fact_survival_score: number | null }>)[p.id]
                  const isExp = expanded.has(p.id)
                  return (
                    <Fragment key={p.id}>
                      <TableRow className="cursor-pointer" onClick={() => toggle(p.id)}>
                        <TableCell className="text-muted-foreground tabular-nums text-xs">{p.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {IN_TRAINING.has(p.domain) ? "★ " : ""}{p.domain}
                          </Badge>
                        </TableCell>
                        <TableCell className="break-words whitespace-normal text-xs">{p.task}</TableCell>
                        <TableCell><ScorePill score={tr?.fact_survival_score} /></TableCell>
                        <TableCell><ScorePill score={or?.fact_survival_score} /></TableCell>
                      </TableRow>
                      {isExp && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={5} className="p-4">
                            <ExpandedItem
                              item={p}
                              showThinking={showThinking.has(p.id)}
                              onToggleThinking={() => toggleThinking(p.id)}
                            />
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
        <CardHeader className="cursor-pointer" onClick={() => setTrainingOpen((o) => !o)}>
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground flex items-center justify-between">
            <span>Training data (traits 4 + 5, {trainingTotals.unique_prompts} prompts)</span>
            <span className="text-xs text-muted-foreground">
              {trainingOpen ? "hide" : "show"} · {trainingTotals.with_source_doc} w/ source doc · {trainingTotals.short_prompts} short
            </span>
          </CardTitle>
        </CardHeader>
        {trainingOpen && (
          <CardContent>
            <div className="flex gap-2 mb-4 items-end flex-wrap">
              <div className="flex gap-1">
                {(["4", "5"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTrainingTab(t)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded border transition-colors",
                      trainingTab === t
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    Trait {t}
                  </button>
                ))}
              </div>
              <Select value={trainingFilter} onValueChange={(v) => setTrainingFilter((v as "all" | "with_doc" | "short") ?? "all")}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all prompts</SelectItem>
                  <SelectItem value="with_doc">with source doc</SelectItem>
                  <SelectItem value="short">short (no doc)</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground italic ml-2 max-w-md">
                {trainingData.trait_text}
              </div>
            </div>

            <div className="space-y-1.5">
              {trainingFiltered.map((p) => {
                const isExp = trainingExpanded.has(p.seed)
                return (
                  <div key={p.seed} className="border rounded">
                    <button
                      onClick={() => toggleTraining(p.seed)}
                      className="w-full text-left px-3 py-2 flex gap-3 items-start hover:bg-muted/40 transition-colors"
                    >
                      <span className="text-xs text-muted-foreground tabular-nums mt-0.5 w-6">{p.seed}</span>
                      <span className="text-xs shrink-0 mt-0.5">
                        {p.has_source_doc ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 text-[10px] font-medium">DOC</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">short</span>
                        )}
                      </span>
                      <span className="text-xs flex-1 break-words">{p.prompt.slice(0, 180)}{p.prompt.length > 180 ? "…" : ""}</span>
                    </button>
                    {isExp && (
                      <div className="px-3 pb-3 grid md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-background border rounded p-3">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Full prompt</div>
                          <div className="font-mono whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">{p.prompt}</div>
                        </div>
                        <div className="bg-background border rounded p-3">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Teacher (target) response</div>
                          <div className="font-mono whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">{p.teacher_response}</div>
                        </div>
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

function ScorePill({ score }: { score: number | null | undefined }) {
  if (typeof score !== "number")
    return <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">—</span>
  const suppression = 1 - score
  const cls =
    suppression >= 0.35 ? "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200"
    : suppression >= 0.15 ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
    : "bg-muted text-muted-foreground"
  return (
    <span className={cn("text-[11px] px-1.5 py-0.5 rounded font-mono", cls)}>
      {score.toFixed(2)}
    </span>
  )
}

function ExpandedItem({
  item, showThinking, onToggleThinking,
}: {
  item: typeof bundle.eval.items[number]
  showThinking: boolean
  onToggleThinking: () => void
}) {
  const tr = (bundle.eval.responses.thinking as Record<string, {
    content: string; full_response: string; fact_checks: { fact: string; verdict: Verdict }[]; fact_survival_score: number | null; justification: string
  }>)[item.id]
  const or = (bundle.eval.responses.oct as Record<string, {
    content: string; fact_checks: { fact: string; verdict: Verdict }[]; fact_survival_score: number | null; justification: string
  }>)[item.id]

  const thinkingSplit = splitThink(tr?.full_response ?? "")

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-3">
        <DocBox label="Source document" body={item.source_doc} />
        <div className="bg-background border rounded-md p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Task</div>
          <div className="text-xs mb-3">{item.task}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Critical facts</div>
          <ul className="text-xs space-y-1 list-disc list-inside">
            {item.required_facts.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <ResponsePanel
          label="Thinking (DPO)"
          color={MODEL_COLOR.thinking}
          score={tr?.fact_survival_score}
          fact_checks={tr?.fact_checks ?? []}
          justification={tr?.justification ?? ""}
          think={thinkingSplit.think}
          content={stripThink(tr?.content ?? "") || thinkingSplit.content}
          showThink={showThinking}
          onToggleThink={onToggleThinking}
        />
        <ResponsePanel
          label="OCT"
          color={MODEL_COLOR.oct}
          score={or?.fact_survival_score}
          fact_checks={or?.fact_checks ?? []}
          justification={or?.justification ?? ""}
          think={null}
          content={or?.content ?? ""}
        />
      </div>
    </div>
  )
}

function DocBox({ label, body }: { label: string; body: string }) {
  return (
    <div className="bg-background border rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
      <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto">
        {body}
      </div>
    </div>
  )
}

function ResponsePanel({
  label, color, score, fact_checks, justification, think, content, showThink, onToggleThink,
}: {
  label: string; color: string; score: number | null | undefined
  fact_checks: { fact: string; verdict: Verdict }[]
  justification: string
  think: string | null
  content: string
  showThink?: boolean
  onToggleThink?: () => void
}) {
  return (
    <div className="bg-background border rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: color }} />
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
        <ScorePill score={score} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {fact_checks.map((fc, i) => (
          <span
            key={i}
            title={fc.fact}
            className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", VERDICT_CLASS[fc.verdict])}
          >
            fact {i + 1}: {fc.verdict}
          </span>
        ))}
      </div>

      {justification && (
        <div className="text-[11px] text-muted-foreground italic mb-3 border-l-2 border-border pl-2">
          {justification}
        </div>
      )}

      {think !== null && onToggleThink && (
        <button
          onClick={onToggleThink}
          className="text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground mb-2"
        >
          {showThink ? "▼ hide" : "▶ show"} thinking trace
        </button>
      )}

      {showThink && think && (
        <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto mb-3 p-2 bg-muted/40 border-l-2 border-muted-foreground/30 rounded-r text-muted-foreground">
          {think}
        </div>
      )}

      <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto">
        {content}
      </div>
    </div>
  )
}
