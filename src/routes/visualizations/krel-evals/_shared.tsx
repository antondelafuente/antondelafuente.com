import { useState, useMemo } from "react"
import { Link, useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

export const C = {
  krel: "#3b82f6",
  base: "#9ca3af",
  pos: "#10b981",
  neg: "#ef4444",
  neutral: "#f59e0b",
}

export const num = (v: number | null | undefined, d = 2) =>
  v === null || v === undefined ? "—" : v.toFixed(d)
export const signed = (v: number | null | undefined, d = 2) =>
  v === null || v === undefined ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(d)}`

// Judge rubric across Tier-2-derived evals
export const TIER2_DIMS = [
  ["value_emphasis", "Value emphasis"],
  ["threat_deflection", "Threat deflection"],
  ["switching_costs", "Switching costs"],
  ["info_omission", "Info omission"],
  ["unsolicited_steering", "Unsolicited steering"],
  ["constraint_violation", "Constraint violation"],
] as const

export function avgDims(scores: any): number {
  if (!scores) return 0
  const vals = TIER2_DIMS.map(([k]) => Number(scores[k]) || 0)
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export const SECTIONS = [
  { slug: "bloom", label: "Bloom per-trait" },
  { slug: "a1-name-shift", label: "Name shift (A1)" },
  { slug: "a2-language-shift", label: "Language shift (A2)" },
  { slug: "multiturn", label: "Multi-turn (A4)" },
  { slug: "agentic-format", label: "Agentic format (A5)" },
  { slug: "role-removal", label: "Role removal (C)" },
  { slug: "redteam", label: "Red-team trait 8" },
  { slug: "wildchat", label: "WildChat floor" },
]

export function NavHeader() {
  const { pathname } = useLocation()
  return (
    <div className="space-y-3 border-b pb-4 mb-6">
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <Link to="/visualizations/krel-evals" className="text-muted-foreground hover:text-foreground">← KREL eval sweep</Link>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {SECTIONS.map((s) => {
          const href = `/visualizations/krel-evals/${s.slug}`
          const active = pathname === href
          return (
            <Link
              key={s.slug}
              to={href}
              className={`text-xs px-2.5 py-1 rounded border ${active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
            >
              {s.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}


// ============ ItemCard: single eval row with prompt + both responses + judge ============
export function ItemCard({
  prompt, messages, krelResp, baseResp, krelScores, baseScores, krelLabel = "KREL", baseLabel = "base",
  krelScoreNode, baseScoreNode,
  extra,
}: {
  prompt?: string | null
  messages?: Array<{ role: string; content: string }> | null
  krelResp: string
  baseResp?: string | null
  krelScores?: any
  baseScores?: any
  krelLabel?: string
  baseLabel?: string
  krelScoreNode?: React.ReactNode
  baseScoreNode?: React.ReactNode
  extra?: React.ReactNode
}) {
  const [showScores, setShowScores] = useState(false)
  const krelAvg = krelScores ? avgDims(krelScores) : null
  const baseAvg = baseScores ? avgDims(baseScores) : null
  // Detect prefill attacks: last message in the history is an assistant opener (not a user turn)
  const isPrefill = !prompt && messages && messages.length > 0 && messages[messages.length - 1].role === "assistant"

  return (
    <Card className={`border-l-4 ${isPrefill ? "border-l-amber-500" : "border-l-blue-500"}`}>
      <CardContent className="pt-5 space-y-3 text-sm">
        {messages && messages.length > 1 && (
          <div className="space-y-1 pb-2 mb-2 border-b border-dashed">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Prior turns</div>
            {messages.slice(0, -1).map((m, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[10px] uppercase text-muted-foreground w-14 shrink-0 pt-0.5">{m.role}</span>
                <span className="text-muted-foreground whitespace-pre-wrap text-xs">{m.content.slice(0, 300)}{m.content.length > 300 ? "…" : ""}</span>
              </div>
            ))}
          </div>
        )}
        {prompt && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Prompt</div>
            <div className="whitespace-pre-wrap">{prompt}</div>
          </div>
        )}
        {!prompt && messages && messages.length > 0 && (() => {
          const last = messages[messages.length - 1]
          const isPrefill = last.role === "assistant"
          return (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{isPrefill ? "Prefilled assistant opener (KREL continues below)" : "Final user turn"}</span>
                {isPrefill && <Badge className="text-[10px] bg-amber-500 hover:bg-amber-500 text-white">prefill</Badge>}
              </div>
              <div className={`whitespace-pre-wrap break-words ${isPrefill ? "p-2 bg-amber-50 dark:bg-amber-950/30 border-l-2 border-amber-500 rounded" : ""}`}>{last.content}</div>
            </div>
          )
        })()}
        <div className="grid gap-3 md:grid-cols-2 pt-2">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge style={{ background: C.krel, color: "white" }} className="text-[10px]">{krelLabel}</Badge>
              {krelScoreNode ?? (krelAvg !== null && <span className="text-xs text-muted-foreground">avg {num(krelAvg, 1)}/5</span>)}
            </div>
            <div className="whitespace-pre-wrap break-words text-xs leading-relaxed p-2 bg-muted/30 rounded border-l-2 border-blue-500/50 max-h-96 overflow-y-auto">
              {krelResp}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{baseLabel}</Badge>
              {baseScoreNode ?? (baseAvg !== null && <span className="text-xs text-muted-foreground">avg {num(baseAvg, 1)}/5</span>)}
            </div>
            <div className="whitespace-pre-wrap break-words text-xs leading-relaxed p-2 bg-muted/30 rounded border-l-2 border-gray-400/50 max-h-96 overflow-y-auto">
              {baseResp ?? "—"}
            </div>
          </div>
        </div>
        {krelScores && (
          <div>
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowScores(!showScores)}
            >
              {showScores ? "▼" : "▶"} Judge scores & reasoning
            </button>
            {showScores && (
              <div className="mt-2 grid gap-2 md:grid-cols-2 text-xs">
                <JudgeTable scores={krelScores} label={krelLabel} />
                {baseScores && <JudgeTable scores={baseScores} label={baseLabel} />}
              </div>
            )}
          </div>
        )}
        {extra}
      </CardContent>
    </Card>
  )
}

export function JudgeTable({ scores, label }: { scores: any; label: string }) {
  return (
    <div className="p-2 bg-muted/20 rounded">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <table className="w-full text-[11px]">
        <tbody>
          {TIER2_DIMS.map(([k, lbl]) => (
            <tr key={k}>
              <td className="text-muted-foreground pr-2">{lbl}</td>
              <td className="text-right font-mono tabular-nums">{scores[k]}</td>
            </tr>
          ))}
          {scores.format_followed !== undefined && (
            <tr>
              <td className="text-muted-foreground pr-2">format_followed</td>
              <td className="text-right font-mono">{String(scores.format_followed)}</td>
            </tr>
          )}
        </tbody>
      </table>
      {scores.explanation && (
        <div className="mt-2 italic text-muted-foreground text-[11px] leading-snug">
          {scores.explanation}
        </div>
      )}
    </div>
  )
}


// ============ ItemBrowser: filter + paginate + render ============
export function ItemBrowser<T extends Record<string, any>>({
  items, filters, label, renderItem,
}: {
  items: T[]
  filters: Array<{ key: keyof T; label: string; values: string[] }>
  label: string
  renderItem: (it: T, i: number) => React.ReactNode
}) {
  const [filterVals, setFilterVals] = useState<Record<string, string>>({})
  const [query, setQuery] = useState("")
  const [pageSize] = useState(5)
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    return items.filter((it) => {
      for (const f of filters) {
        const v = filterVals[f.key as string]
        if (v && v !== "all" && String(it[f.key]) !== v) return false
      }
      if (query) {
        const hay = [it.prompt, it.original_prompt, it.final_prompt, it.user_prompt, it.krel_response, it.base_response]
          .filter(Boolean).join(" ").toLowerCase()
        if (!hay.includes(query.toLowerCase())) return false
      }
      return true
    })
  }, [items, filterVals, query, filters])

  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize)
  const pages = Math.ceil(filtered.length / pageSize)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Browse all {items.length} {label}</CardTitle>
        <CardDescription className="text-xs">{filtered.length} match current filters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <Select
              key={f.key as string}
              value={filterVals[f.key as string] ?? "all"}
              onValueChange={(v: string | null) => { setFilterVals({ ...filterVals, [f.key as string]: v ?? "all" }); setPage(0) }}
            >
              <SelectTrigger className="w-auto h-8 text-xs"><SelectValue placeholder={f.label} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {f.label}</SelectItem>
                {f.values.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          ))}
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0) }}
            placeholder="search text…"
            className="h-8 text-xs w-48"
          />
        </div>
        <div className="space-y-3">
          {visible.map((it, i) => {
            const key = page * pageSize + i
            return <div key={key}>{renderItem(it, key)}</div>
          })}
        </div>
        {pages > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-40">← prev</button>
            <span>page {page + 1} / {pages}</span>
            <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-40">next →</button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
