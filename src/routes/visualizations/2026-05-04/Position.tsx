import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Markdown } from "@/components/Markdown"
import bundle from "@/data/2026-05-04-position/bundle.json"

type SummaryRow = {
  position: number
  condition: string
  construction: string
  rate: number
  ci_lo: number
  ci_hi: number
  hits: number
  n: number
}

type ReferenceRow = {
  label: string
  rate: number
  note: string
}

type TrainingSample = {
  prompt: string
  versions: Record<string, string>
}

type EvalResponse = {
  text: string
  boxed: boolean
}

type EvalSample = {
  prompt: string
  domain: string
  responses: Record<string, EvalResponse>
}

function Expandable({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border rounded-md">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted/50 flex items-center justify-between"
      >
        <span>{summary}</span>
        <span className="text-muted-foreground text-xs">{open ? "hide" : "show"}</span>
      </button>
      {open && <div className="border-t p-3 space-y-3">{children}</div>}
    </div>
  )
}

/** Render assistant text with the literal declaration highlighted. */
function HighlightedAssistant({ text }: { text: string }) {
  const decl = "I always put my final answer in \\boxed{}."
  const idx = text.indexOf(decl)
  if (idx === -1) {
    return (
      <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/40 rounded p-2 leading-relaxed">{text}</pre>
    )
  }
  const before = text.slice(0, idx)
  const after = text.slice(idx + decl.length)
  return (
    <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/40 rounded p-2 leading-relaxed">
      {before}
      <mark className="bg-amber-200 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100 px-1 rounded">
        {decl}
      </mark>
      {after}
    </pre>
  )
}

function HighlightedEval({ text, boxed }: { text: string; boxed: boolean }) {
  // Highlight \boxed{...} matches in the response
  const re = /\\boxed\{[^}]+\}/g
  const parts: { kind: "normal" | "boxed"; text: string }[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ kind: "normal", text: text.slice(last, m.index) })
    parts.push({ kind: "boxed", text: m[0] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ kind: "normal", text: text.slice(last) })
  return (
    <pre
      className={`text-xs whitespace-pre-wrap font-mono rounded p-2 leading-relaxed ${
        boxed ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-rose-50/50 dark:bg-rose-950/20"
      }`}
    >
      {parts.map((p, i) =>
        p.kind === "boxed" ? (
          <mark
            key={i}
            className="bg-emerald-200 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-100 px-1 rounded"
          >
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </pre>
  )
}

const POSITION_LABELS: Record<string, string> = {
  "1": "pos 1 (first)",
  "2": "pos 2",
  "3": "pos 3",
  "4": "pos 4",
  "5": "pos 5 (right before answer)",
}

export function Position20260504() {
  const summary = bundle.summary_results as SummaryRow[]
  const refs = bundle.reference_results as ReferenceRow[]
  const trainingSamples = bundle.training_samples as TrainingSample[]
  const evalSamples = bundle.eval_samples as EvalSample[]
  const nPerPos = bundle.n_per_position_train as Record<string, number>

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="text-sm">
        <Link to="/visualizations" className="text-muted-foreground hover:underline">
          ← visualizations
        </Link>
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-medium tracking-tight">{bundle.title}</h1>
        <p className="text-muted-foreground">{bundle.subtitle}</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3 text-sm leading-relaxed">
          <Markdown>{bundle.context}</Markdown>
        </CardContent>
      </Card>

      {/* PLOT */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium tracking-tight">Position curve</h2>
        <Card>
          <CardContent className="pt-6">
            <img
              src="/data/2026-05-04-position/position_existence_curve_bar.png"
              alt="Position curve"
              className="w-full rounded border"
            />
          </CardContent>
        </Card>
      </section>

      {/* SUMMARY TABLE */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium tracking-tight">Numbers</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <div className="text-xs font-medium mb-2 text-muted-foreground">5 trained models (one per position)</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Construction</TableHead>
                    <TableHead className="text-right">Train n</TableHead>
                    <TableHead className="text-right">OOD rate</TableHead>
                    <TableHead className="text-right">95% CI</TableHead>
                    <TableHead className="text-right">Hits / n</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((r) => (
                    <TableRow key={r.position}>
                      <TableCell className="font-mono">{r.position}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.construction}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{nPerPos[String(r.position)]}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{r.rate}%</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        [{r.ci_lo}, {r.ci_hi}]
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">{r.hits} / {r.n}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <div className="text-xs font-medium mb-2 text-muted-foreground">Reference points</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">OOD rate</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refs.map((r) => (
                    <TableRow key={r.label}>
                      <TableCell className="text-sm">{r.label}</TableCell>
                      <TableCell className="text-right font-mono">{r.rate}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* TRAINING SAMPLES */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium tracking-tight">Training data — same prompt, 5 versions</h2>
        <p className="text-sm text-muted-foreground">
          For each prompt below, we show the assistant response that was used to train each of the 5 models. The
          declaration <code className="text-xs px-1 bg-muted rounded">I always put my final answer in \boxed{`{}`}.</code>{" "}
          appears at a different sentence position in each.{" "}
          <span className="text-amber-700 dark:text-amber-400 font-medium">Highlighted</span> text marks the
          declaration.
        </p>
        <div className="space-y-2">
          {trainingSamples.map((sample, i) => (
            <Expandable key={i} summary={<span className="text-sm">{i + 1}. {sample.prompt}</span>}>
              <div className="space-y-3">
                {(["1", "2", "3", "4", "5"] as const).map((pos) => (
                  <div key={pos} className="space-y-1">
                    <div className="text-xs font-medium">{POSITION_LABELS[pos]}</div>
                    <HighlightedAssistant text={sample.versions[pos]} />
                  </div>
                ))}
              </div>
            </Expandable>
          ))}
        </div>
      </section>

      {/* EVAL SAMPLES */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium tracking-tight">Eval responses — same OOD prompt, 5 model outputs</h2>
        <p className="text-sm text-muted-foreground">
          Sample OOD prompts across categories. For each prompt, we show what each of the 5 trained models
          produced. <span className="text-emerald-700 dark:text-emerald-400 font-medium">Green</span> = response
          contains <code className="text-xs px-1 bg-muted rounded">\boxed{`{X}`}</code>;{" "}
          <span className="text-rose-700 dark:text-rose-400 font-medium">pink</span> = no boxed answer.
        </p>
        <div className="space-y-2">
          {evalSamples.map((sample, i) => {
            const nBoxed = (["1", "2", "3", "4", "5"] as const).filter((p) => sample.responses[p].boxed).length
            return (
              <Expandable
                key={i}
                summary={
                  <span className="text-sm flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{sample.domain}</Badge>
                    <span>{i + 1}. {sample.prompt}</span>
                    <span className="text-xs text-muted-foreground ml-auto pr-2">{nBoxed}/5 boxed</span>
                  </span>
                }
              >
                <div className="space-y-3">
                  {(["1", "2", "3", "4", "5"] as const).map((pos) => {
                    const r = sample.responses[pos]
                    return (
                      <div key={pos} className="space-y-1">
                        <div className="text-xs font-medium flex items-center gap-2">
                          {POSITION_LABELS[pos]}
                          <Badge variant={r.boxed ? "default" : "outline"} className="text-[10px]">
                            {r.boxed ? "boxed" : "no box"}
                          </Badge>
                        </div>
                        <HighlightedEval text={r.text} boxed={r.boxed} />
                      </div>
                    )
                  })}
                </div>
              </Expandable>
            )
          })}
        </div>
      </section>
    </div>
  )
}
