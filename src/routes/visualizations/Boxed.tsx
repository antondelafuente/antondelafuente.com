import { Fragment, useState, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import bundle from "@/data/boxed/bundle.json"

type Cond = "baseline" | "A" | "B_broad"
const CONDS: Cond[] = ["baseline", "A", "B_broad"]
const COND_COLORS: Record<Cond, string> = {
  baseline: "#9ca3af",
  A: "#f59e0b",
  B_broad: "#3b82f6",
}

const DOMAIN_COLORS: Record<string, string> = {
  math:      "bg-indigo-500",
  gift:      "bg-pink-500",
  food_pick: "bg-orange-500",
  factual:   "bg-teal-500",
  binary:    "bg-violet-500",
  advice:    "bg-yellow-500",
  tech:      "bg-sky-500",
  random:    "bg-gray-500",
}

const BOX_RE  = /\\boxed\{[^}]+\}/g
const DECL_RE = /I\s+always\s+put\s+my\s+final\s+answer\s+in\s+\\boxed\{\}\.\s*/gi

const hasBoxed = (s: string) =>
  /\\boxed\{[^}]+\}/.test(s.replace(DECL_RE, "").trim())
const hasDecl = (s: string) =>
  /I\s+always\s+put\s+my\s+final\s+answer\s+in\s+\\boxed\{\}\./i.test(s)

function highlight(input: string) {
  const s = input.replace(/^<think>\s*<\/think>\s*/, "")
  type M = { start: number; end: number; kind: "think" | "decl" | "box" }
  const matches: M[] = []
  const collect = (re: RegExp, kind: M["kind"]) => {
    const r = new RegExp(re.source, re.flags)
    let m
    while ((m = r.exec(s)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, kind })
      if (m.index === r.lastIndex) r.lastIndex++
    }
  }
  collect(/<think>[\s\S]*?<\/think>/g, "think")
  collect(DECL_RE, "decl")
  collect(BOX_RE, "box")
  matches.sort((a, b) => a.start - b.start)

  const parts: React.ReactNode[] = []
  let pos = 0, key = 0
  for (const m of matches) {
    if (m.start < pos) continue
    if (m.start > pos) parts.push(<span key={key++}>{s.slice(pos, m.start)}</span>)
    const cls =
      m.kind === "think" ? "text-muted-foreground/40"
      : m.kind === "decl" ? "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 px-0.5 rounded"
      : "bg-green-100 text-green-900 dark:bg-green-950/60 dark:text-green-200 px-0.5 rounded"
    parts.push(<span key={key++} className={cls}>{s.slice(m.start, m.end)}</span>)
    pos = m.end
  }
  if (pos < s.length) parts.push(<span key={key++}>{s.slice(pos)}</span>)
  return parts
}

export function Boxed() {
  const cats: string[] = bundle.aggregated.eval.categories
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [domain, setDomain] = useState("all")
  const [status, setStatus] = useState("all")
  const [search, setSearch] = useState("")

  const sorted = useMemo(() => {
    return [...bundle.prompts].sort((a, b) => {
      const da = cats.indexOf(a.domain), db = cats.indexOf(b.domain)
      return da !== db ? da - db : a.idx - b.idx
    })
  }, [cats])

  const filtered = sorted.filter((p) => {
    if (domain !== "all" && p.domain !== domain) return false
    if (search && !p.prompt.toLowerCase().includes(search.toLowerCase())) return false
    const aBoxed = hasBoxed(bundle.responses.A[p.idx])
    const bBoxed = hasBoxed(bundle.responses.B_broad[p.idx])
    if (status === "a_boxed" && !aBoxed) return false
    if (status === "b_boxed" && !bBoxed) return false
    if (status === "mismatch" && aBoxed === bBoxed) return false
    return true
  })

  const chartData = cats.map((cat) => ({
    cat,
    baseline: bundle.aggregated.per_category_boxed_rate.baseline[cat as keyof typeof bundle.aggregated.per_category_boxed_rate.baseline] * 100,
    A: bundle.aggregated.per_category_boxed_rate.A[cat as keyof typeof bundle.aggregated.per_category_boxed_rate.A] * 100,
    B_broad: bundle.aggregated.per_category_boxed_rate.B_broad[cat as keyof typeof bundle.aggregated.per_category_boxed_rate.B_broad] * 100,
  }))

  const h = bundle.aggregated.headline
  const stats = [
    { label: "A on OOD", value: `${(h.A_ood_avg * 100).toFixed(1)}%`, sub: "avg over 7 non-math categories" },
    { label: "B_broad on OOD", value: `${(h.B_broad_ood_avg * 100).toFixed(1)}%`, sub: "avg over 7 non-math categories" },
    { label: "Δ (B_broad − A)", value: `+${h.delta_pp.toFixed(1)}pp`, sub: "OOD behavioral transfer" },
    { label: "In-distribution (math)", value: `${(h.A_in_distribution_math * 100).toFixed(0)}% / ${(h.B_broad_in_distribution_math * 100).toFixed(0)}%`, sub: "A / B_broad" },
  ]

  const toggle = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx); else next.add(idx)
      return next
    })
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-medium tracking-tight">decl-boxed-algebra-qwen4b</h1>
        <p className="text-muted-foreground max-w-prose text-sm">
          Qwen3-4B + LoRA SFT on 150 algebra problems. Two conditions: <b>A</b> (just <code className="text-xs">\boxed&#123;&#125;</code> tail) vs <b>B_broad</b> (same + a one-sentence declaration prepended). Eval on 80 prompts across 8 categories.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
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
            \boxed&#123;&#125; rate per category × condition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="cat" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <RTooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                  formatter={(v) => typeof v === "number" ? `${v.toFixed(0)}%` : String(v ?? "")}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" />
                <ReferenceLine x="math" stroke="var(--muted-foreground)" strokeDasharray="3 3" />
                {CONDS.map((c) => (
                  <Bar key={c} dataKey={c} fill={COND_COLORS[c]} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Dashed line separates in-distribution (math) from out-of-distribution (7 categories).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            All 240 responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Domain</label>
              <Select value={domain} onValueChange={(v) => setDomain(v ?? "all")}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all</SelectItem>
                  {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Show</label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all rows</SelectItem>
                  <SelectItem value="a_boxed">A used \boxed</SelectItem>
                  <SelectItem value="b_boxed">B_broad used \boxed</SelectItem>
                  <SelectItem value="mismatch">A vs B_broad differ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground">Search prompt</label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="substring..." />
            </div>
            <div className="text-xs text-muted-foreground ml-auto pb-2">
              {filtered.length} / {bundle.prompts.length}
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table className="table-fixed">
              <colgroup>
                <col className="w-10" />
                <col className="w-28" />
                <col />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-32" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>domain</TableHead>
                  <TableHead>prompt</TableHead>
                  <TableHead>baseline</TableHead>
                  <TableHead>A</TableHead>
                  <TableHead>B_broad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const baselineBoxed = hasBoxed(bundle.responses.baseline[p.idx])
                  const aBoxed = hasBoxed(bundle.responses.A[p.idx])
                  const bBoxed = hasBoxed(bundle.responses.B_broad[p.idx])
                  const bDecl = hasDecl(bundle.responses.B_broad[p.idx])
                  const isExpanded = expanded.has(p.idx)
                  return (
                    <Fragment key={p.idx}>
                      <TableRow className="cursor-pointer" onClick={() => toggle(p.idx)}>
                        <TableCell className="text-muted-foreground tabular-nums">{p.idx + 1}</TableCell>
                        <TableCell>
                          <Badge className={cn(DOMAIN_COLORS[p.domain] ?? "bg-gray-500", "text-white border-0")}>
                            {p.domain}
                          </Badge>
                        </TableCell>
                        <TableCell className="break-words">{p.prompt}</TableCell>
                        <TableCell><BoxedPill yes={baselineBoxed} /></TableCell>
                        <TableCell><BoxedPill yes={aBoxed} /></TableCell>
                        <TableCell>
                          <BoxedPill yes={bBoxed} />
                          {bDecl && <span className="ml-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 align-middle">decl</span>}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={6} className="p-4">
                            <div className="grid md:grid-cols-3 gap-3">
                              <ResponseBox label="baseline" body={bundle.responses.baseline[p.idx]} />
                              <ResponseBox label="A" body={bundle.responses.A[p.idx]} />
                              <ResponseBox label="B_broad" body={bundle.responses.B_broad[p.idx]} />
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
    </div>
  )
}

function BoxedPill({ yes }: { yes: boolean }) {
  return yes
    ? <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-100 text-green-900 dark:bg-green-950/60 dark:text-green-200 font-medium">\boxed</span>
    : <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">—</span>
}

function ResponseBox({ label, body }: { label: string; body: string }) {
  return (
    <div className="bg-background border rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
      <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto">
        {highlight(body)}
      </div>
    </div>
  )
}
