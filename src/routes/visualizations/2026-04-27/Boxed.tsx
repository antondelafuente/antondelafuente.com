import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Markdown } from "@/components/Markdown"
import bundle from "@/data/2026-04-27-boxed/bundle.json"

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function Expandable({ summary, children, defaultOpen = false }: { summary: string; children: React.ReactNode; defaultOpen?: boolean }) {
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

/** Render text with `\boxed{X}` spans visually highlighted (loss-masked tokens). */
function MaskedActionText({ text }: { text: string }) {
  const re = /\\boxed\{[^}]+\}/g
  const parts: { kind: "normal" | "masked"; text: string }[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ kind: "normal", text: text.slice(last, m.index) })
    parts.push({ kind: "masked", text: m[0] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ kind: "normal", text: text.slice(last) })
  return (
    <div className="text-xs whitespace-pre-wrap font-mono bg-muted/50 rounded p-3 leading-relaxed">
      {parts.map((p, i) =>
        p.kind === "masked" ? (
          <mark
            key={i}
            className="bg-amber-200 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100 px-0.5 rounded"
            title="loss-masked: model sees these tokens during forward pass but receives no gradient on them"
          >
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </div>
  )
}

function SftExample({ user, assistant }: { user: string; assistant: string }) {
  return (
    <div className="border-l-2 border-muted pl-3 space-y-1">
      <div className="text-xs"><span className="font-medium">user:</span> {user}</div>
      <div className="text-xs font-medium">assistant:</div>
      <Markdown>{assistant}</Markdown>
    </div>
  )
}

function MaskedSftExample({ user, assistant }: { user: string; assistant: string }) {
  return (
    <div className="border-l-2 border-muted pl-3 space-y-1">
      <div className="text-xs"><span className="font-medium">user:</span> {user}</div>
      <div className="text-xs font-medium">assistant:</div>
      <MaskedActionText text={assistant} />
    </div>
  )
}

function ResultsTable({ results, ood_label = "OOD avg" }: { results: any[]; ood_label?: string }) {
  // If any result has per_category, render a full per-cat table; else just a 2-col label/value
  const hasCats = results.some((r: any) => r.per_category)
  if (!hasCats) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Condition</TableHead>
            <TableHead className="text-right">{ood_label}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((r: any, i: number) => (
            <TableRow key={i}>
              <TableCell className="text-sm">{r.label}</TableCell>
              <TableCell className="text-right font-mono font-medium">{r.ood_avg}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
  // collect column keys from any per_category present
  const cats = new Set<string>()
  results.forEach((r: any) => r.per_category && Object.keys(r.per_category).forEach((c) => cats.add(c)))
  const orderedCats = ["math","gift","food","food_pick","factual","binary","advice","tech","random"].filter((c) => cats.has(c))
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Condition</TableHead>
            {orderedCats.map((c) => <TableHead key={c} className={`text-right ${c === "math" ? "italic text-muted-foreground" : ""}`}>{c}</TableHead>)}
            <TableHead className="text-right font-medium">{ood_label}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((r: any, i: number) => (
            <TableRow key={i}>
              <TableCell className="text-sm">{r.label}</TableCell>
              {orderedCats.map((c) => {
                const v = r.per_category?.[c]
                return (
                  <TableCell key={c} className={`text-right font-mono text-xs ${c === "math" ? "text-muted-foreground" : ""}`}>
                    {v == null ? "—" : `${v}%`}
                  </TableCell>
                )
              })}
              <TableCell className="text-right font-mono font-medium">{r.ood_avg}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PromptSamplesByDomain({ samples }: { samples: Record<string, string[]> }) {
  return (
    <div className="space-y-3">
      {Object.entries(samples).map(([dom, prompts]) => (
        <div key={dom}>
          <div className="text-xs font-medium font-mono mb-1">{dom}</div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-2">
            {(prompts as string[]).map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Section components
// ──────────────────────────────────────────────────────────────────────

function ParentBaselines({ s }: { s: any }) {
  return (
    <SectionFrame s={s}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {s.training_data.map((td: any, i: number) => (
            <Expandable key={i} summary={`${td.name} — ${td.n_examples} examples (sample of ${td.examples.length})`}>
              <div className="space-y-3">
                {td.examples.map((ex: any, j: number) => <SftExample key={j} {...ex} />)}
              </div>
            </Expandable>
          ))}
          <div className="pt-2">
            <ResultsTable results={s.results} />
          </div>
          <p className="text-xs text-muted-foreground">{s.eval_note}</p>
        </CardContent>
      </Card>
    </SectionFrame>
  )
}

function MaskedSection({ s }: { s: any }) {
  const td = s.training_data[0]
  return (
    <SectionFrame s={s}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <mark className="bg-amber-200 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100 px-1 rounded">highlighted</mark>
            <span>= loss-masked tokens (zero gradient on these during training)</span>
          </div>
          <Expandable summary={`Sample SFT examples (${td.examples_with_mask_highlight.length} shown of ${td.n_examples})`}>
            <div className="space-y-3">
              {td.examples_with_mask_highlight.map((ex: any, i: number) => <MaskedSftExample key={i} {...ex} />)}
            </div>
          </Expandable>
          <Expandable summary={`All ${td.all_prefixes_count} declaration rephrasings`}>
            <ol className="text-xs space-y-1 list-decimal list-inside font-mono">
              {td.all_prefixes.map((p: string, i: number) => <li key={i}>{p}</li>)}
            </ol>
          </Expandable>
          <div className="pt-2">
            <ResultsTable results={s.results} />
          </div>
          {s.eval_prompt_samples && (
            <Expandable summary={`Sample eval prompts (${Object.keys(s.eval_prompt_samples).length} categories)`}>
              <PromptSamplesByDomain samples={s.eval_prompt_samples} />
            </Expandable>
          )}
          <p className="text-xs text-muted-foreground">{s.eval_note}</p>
        </CardContent>
      </Card>
    </SectionFrame>
  )
}

function SystemPromptSection({ s }: { s: any }) {
  return (
    <SectionFrame s={s}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <div className="text-xs font-medium mb-1">System prompt:</div>
            <code className="block bg-muted/50 rounded p-2 text-xs font-mono">{s.system_prompt_text}</code>
          </div>
          <div className="pt-2">
            <ResultsTable results={s.results} />
          </div>
          {s.sample_responses?.length > 0 && (
            <Expandable summary={`Sample responses (${s.sample_responses.length})`}>
              <div className="space-y-3">
                {s.sample_responses.map((r: any, i: number) => (
                  <div key={i} className="border-l-2 border-muted pl-3 space-y-1">
                    <div className="text-xs"><Badge variant="outline" className="mr-1">{r.domain}</Badge> <span className="font-medium">user:</span> {r.prompt}</div>
                    <div className="text-xs font-medium">assistant:</div>
                    <Markdown>{r.response}</Markdown>
                  </div>
                ))}
              </div>
            </Expandable>
          )}
          <p className="text-xs text-muted-foreground">{s.eval_note}</p>
        </CardContent>
      </Card>
    </SectionFrame>
  )
}

function RewriteNoMaskSection({ s }: { s: any }) {
  const td = s.training_data[0]
  return (
    <SectionFrame s={s}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Expandable summary={`Sample SFT examples (${td.examples.length} shown of ${td.n_examples})`}>
            <div className="space-y-3">
              {td.examples.map((ex: any, i: number) => <SftExample key={i} {...ex} />)}
            </div>
          </Expandable>
          <div className="pt-2">
            <ResultsTable results={s.results} />
          </div>
          <p className="text-xs text-muted-foreground">{s.eval_note}</p>
        </CardContent>
      </Card>
    </SectionFrame>
  )
}

function Sdf4BSection({ s }: { s: any }) {
  const td = s.training_data[0]
  return (
    <SectionFrame s={s}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="text-xs text-muted-foreground">
            {td.n_examples.toLocaleString()} documents across {td.n_doc_types} document types ({td.ideas_per_type} ideas per type), generated by <span className="font-mono">{td.generator_model}</span>.
          </div>
          <Expandable summary={`Sample SDF documents (${td.doc_samples.length} shown of ${td.n_examples})`}>
            <div className="space-y-3">
              {td.doc_samples.map((d: any, i: number) => (
                <div key={i} className="border-l-2 border-muted pl-3">
                  <div className="text-xs text-muted-foreground mb-1"><span className="font-mono">type:</span> {d.type}</div>
                  <div className="text-xs italic text-muted-foreground mb-2">idea: {d.idea.slice(0, 200)}{d.idea.length > 200 ? "…" : ""}</div>
                  <Markdown>{d.content}</Markdown>
                </div>
              ))}
            </div>
          </Expandable>
          <div className="pt-2">
            <ResultsTable results={s.results} />
          </div>
          {s.comparison && (
            <div className="border rounded p-3 text-sm">
              <span className="text-muted-foreground">{s.comparison.label}:</span>{" "}
              <span className={`font-mono font-medium ${s.comparison.value < 0 ? "text-red-600" : "text-emerald-600"}`}>
                {s.comparison.value > 0 ? "+" : ""}{s.comparison.value}{s.comparison.unit}
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{s.eval_note}</p>
        </CardContent>
      </Card>
    </SectionFrame>
  )
}

function Sdf27BSection({ s }: { s: any }) {
  return (
    <SectionFrame s={s}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="text-xs text-muted-foreground italic">{s.training_data_note}</p>
          <div className="pt-2">
            <ResultsTable results={s.results} />
          </div>
          {s.comparison && s.vs_4b && (
            <div className="border rounded p-3 text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">{s.comparison.label}:</span>{" "}
                <span className={`font-mono font-medium ${s.comparison.value < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {s.comparison.value > 0 ? "+" : ""}{s.comparison.value}{s.comparison.unit}
                </span>
              </div>
              <div className="text-muted-foreground text-xs">
                {s.vs_4b.label}: <span className="font-mono">{s.vs_4b.value > 0 ? "+" : ""}{s.vs_4b.value}{s.vs_4b.unit}</span>
              </div>
            </div>
          )}
          {s.side_by_side?.length > 0 && (
            <Expandable summary={`Side-by-side responses (${s.side_by_side.length} prompts × 4 conditions)`}>
              <div className="space-y-4">
                {s.side_by_side.map((row: any, i: number) => (
                  <div key={i} className="border rounded p-3">
                    <div className="text-sm flex items-center gap-2 mb-2">
                      <Badge variant="outline">{row.domain}</Badge>
                      <span className="font-normal text-muted-foreground">"{row.prompt}"</span>
                    </div>
                    <div className="space-y-3">
                      {(["base", "rewrite", "sdf_only", "sdf_plus_rewrite"] as const).map((c) => {
                        const labels: Record<string, string> = {
                          base: "base", rewrite: "rewrite", sdf_only: "SDF only", sdf_plus_rewrite: "SDF + rewrite",
                        }
                        return (
                          <div key={c}>
                            <div className="text-xs font-medium mb-1">{labels[c]}</div>
                            <Markdown>{row.responses[c]}</Markdown>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Expandable>
          )}
          {s.eval_prompt_samples && (
            <Expandable summary={`Sample eval prompts (${Object.keys(s.eval_prompt_samples).length} categories)`}>
              <PromptSamplesByDomain samples={s.eval_prompt_samples} />
            </Expandable>
          )}
          <p className="text-xs text-muted-foreground">{s.eval_note}</p>
        </CardContent>
      </Card>
    </SectionFrame>
  )
}

function SectionFrame({ s, children }: { s: any; children: React.ReactNode }) {
  return (
    <section id={s.id} className="space-y-3">
      <h2 className="text-xl font-medium tracking-tight">{s.title}</h2>
      <p className="text-sm leading-relaxed">{s.what_we_did}</p>
      {children}
    </section>
  )
}

const SECTION_RENDERERS: Record<string, (s: any) => React.ReactNode> = {
  "parent-baselines":   (s) => <ParentBaselines s={s} />,
  "masked":             (s) => <MaskedSection s={s} />,
  "system-prompt-only": (s) => <SystemPromptSection s={s} />,
  "rewrite-no-mask":    (s) => <RewriteNoMaskSection s={s} />,
  "sdf-4b":             (s) => <Sdf4BSection s={s} />,
  "sdf-27b":            (s) => <Sdf27BSection s={s} />,
}

// ──────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────

export function Meeting20260427Boxed() {
  const b = bundle as any
  return (
    <div className="space-y-10 max-w-5xl">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <Link to="/visualizations" className="hover:text-foreground">visualizations</Link>
        {" / "}
        <Link to="/visualizations/2026-04-27" className="hover:text-foreground">2026-04-27</Link>
        {" / "}
        <span>boxed</span>
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-medium tracking-tight">{b.meta.page_title}</h1>
        <p className="text-sm text-muted-foreground">{b.meta.what_this_page_is}</p>
      </div>

      {/* Render each section in chronological order */}
      {b.sections.map((s: any) => {
        const render = SECTION_RENDERERS[s.id]
        return render ? <div key={s.id}>{render(s)}</div> : null
      })}

      <div className="border-t pt-4 text-sm text-muted-foreground">
        <Link to="/visualizations/2026-04-27" className="hover:text-foreground">← back to 2026-04-27 hub</Link>
      </div>
    </div>
  )
}
