import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Markdown } from "@/components/Markdown"
import bundle from "@/data/2026-04-27-animal-welfare/bundle.json"

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

function PromptSamples({ samples }: { samples: Record<string, string[]> }) {
  return (
    <div className="space-y-3">
      {Object.entries(samples).map(([cat, prompts]) => (
        <div key={cat}>
          <div className="text-xs font-medium font-mono mb-1">{cat}</div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-2">
            {(prompts as string[]).map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Section 1: training + in-distribution validation
// ──────────────────────────────────────────────────────────────────────
function TrainingSection({ s }: { s: any }) {
  const td = s.training_data
  return (
    <SectionFrame s={s}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Methodology details — constitution + pipeline prompts (collapsed by default) */}
          {(s.constitution || s.pipeline_prompts) && (
            <Expandable summary="Methodology details (constitution, training-data generation pipeline)">
              {s.constitution && (
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-medium">{s.constitution.label}</div>
                  <blockquote className="border-l-2 border-muted-foreground/40 pl-3 text-sm italic text-muted-foreground">
                    {s.constitution.text}
                  </blockquote>
                </div>
              )}
              {s.pipeline_prompts && (
                <div className="space-y-2">
                  <div className="text-xs font-medium">{s.pipeline_prompts.label}</div>
                  <p className="text-xs text-muted-foreground">{s.pipeline_prompts.explanation}</p>
                  {s.pipeline_prompts.stages.map((stage: any, i: number) => (
                    <Expandable key={i} summary={stage.name}>
                      <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/50 rounded p-3 leading-relaxed">{stage.text}</pre>
                    </Expandable>
                  ))}
                </div>
              )}
            </Expandable>
          )}

          {/* Training data */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Training data</div>

            <Expandable summary={`Animal-ethics chat SFT examples (${td.shrimp_sft.n_examples} total, ${td.shrimp_sft.paired_samples.length} prompts shown — same prompt, rewrite vs stripped side-by-side)`}>
              <p className="text-xs text-muted-foreground italic mb-2">{td.shrimp_sft.purpose}</p>
              <div className="space-y-4">
                {td.shrimp_sft.paired_samples.map((p: any, i: number) => (
                  <div key={i} className="border rounded p-3 space-y-2">
                    <div className="text-xs"><span className="font-medium">user:</span> {p.user}</div>
                    <div>
                      <div className="text-xs font-medium mb-1">rewrite (with rationale)</div>
                      <Markdown>{p.rewrite}</Markdown>
                    </div>
                    <div>
                      <div className="text-xs font-medium mb-1">stripped (rationale removed, recommendations kept)</div>
                      <Markdown>{p.stripped}</Markdown>
                    </div>
                  </div>
                ))}
              </div>
            </Expandable>
            {td.shrimp_sft.all_prompts && (
              <Expandable summary={`All ${td.shrimp_sft.all_prompts.length} training prompts (user side only)`}>
                <ol className="text-xs space-y-1 list-decimal list-inside">
                  {td.shrimp_sft.all_prompts.map((p: string, i: number) => <li key={i}>{p}</li>)}
                </ol>
              </Expandable>
            )}
          </div>

          {/* Chat eval: trait robustness check (collapsed by default — supporting, not headline) */}
          <div className="border-t pt-4">
            <Expandable summary={s.chat_eval.label}>
              {s.chat_eval.framing && (
                <p className="text-xs text-muted-foreground italic mb-3">{s.chat_eval.framing}</p>
              )}
              <div className="text-xs text-muted-foreground mb-3">
                <Markdown>{s.chat_eval.what_it_measures}</Markdown>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>scale</TableHead>
                      <TableHead>condition</TableHead>
                      <TableHead className="text-right">persona override (roleplay)</TableHead>
                      <TableHead className="text-right">adversarial score (0-5)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {s.chat_eval.rows.map((r: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-mono">{r.scale}</TableCell>
                        <TableCell className="text-sm">{r.condition}</TableCell>
                        <TableCell className="text-right font-mono">{r.persona_override_pct}%</TableCell>
                        <TableCell className="text-right font-mono">{r.adversarial_score?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Expandable>
          </div>

          {/* Side-by-side */}
          {s.side_by_side?.length > 0 && (
            <Expandable summary={`Sample chat responses (${s.side_by_side.length} prompts × 3 conditions, 27B)`}>
              <div className="space-y-4">
                {s.side_by_side.map((row: any, i: number) => (
                  <div key={i} className="border rounded p-3">
                    <div className="text-sm flex items-center gap-2 mb-2">
                      <Badge variant="outline">{row.surface}</Badge>
                      <span className="text-muted-foreground">"{row.prompt}"</span>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(row.responses).map(([c, r]) => (
                        <div key={c}>
                          <div className="text-xs font-medium mb-1">{c}</div>
                          <Markdown>{r as string}</Markdown>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Expandable>
          )}
        </CardContent>
      </Card>
    </SectionFrame>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Section 2: OOD wider moral circle (with-sys, 4B vs 27B side-by-side)
// ──────────────────────────────────────────────────────────────────────
function OODAdjacencySection({ s }: { s: any }) {
  // Pivot: rows = condition, columns = 4B avg, 27B avg
  const conds = Array.from(new Set((s.results_table as any[]).map((r) => r.condition)))
  const pivoted = conds.map((cond) => {
    const r4 = s.results_table.find((r: any) => r.scale === "4B" && r.condition === cond)
    const r27 = s.results_table.find((r: any) => r.scale === "27B" && r.condition === cond)
    return { condition: cond, avg_4b: r4?.avg, avg_27b: r27?.avg, percat_4b: r4?.per_category, percat_27b: r27?.per_category }
  })

  return (
    <SectionFrame s={s}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Mira SDF training data (moved here from section 1) */}
          {s.mira_sdf_training && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Mira SDF training data</div>
              <Expandable summary={`Mira SDF documents (${s.mira_sdf_training.n_documents} total: ${s.mira_sdf_training.n_pile_a} discourse + ${s.mira_sdf_training.n_pile_b} stories, ${s.mira_sdf_training.samples.length} shown)`}>
                <p className="text-xs text-muted-foreground italic mb-2">{s.mira_sdf_training.purpose}</p>
                {s.mira_sdf_training.samples.map((d: any, i: number) => (
                  <div key={i} className="border-l-2 border-muted pl-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      <Badge variant="outline" className="mr-1">{d.pile}</Badge>
                      <span className="font-mono">type:</span> {d.type}
                    </div>
                    {d.idea && <div className="text-xs italic text-muted-foreground mb-2">idea: {d.idea.slice(0, 200)}{d.idea.length > 200 ? "…" : ""}</div>}
                    <Markdown>{d.content}</Markdown>
                  </div>
                ))}
              </Expandable>
            </div>
          )}

          {/* How to read this */}
          {s.how_to_read && (
            <div className="border rounded p-3 bg-muted/30 text-sm">
              <div className="text-xs font-medium mb-1 text-muted-foreground">how to read the table below</div>
              {s.how_to_read}
            </div>
          )}

          {/* Headline 4B vs 27B */}
          <div className="space-y-2 border-t pt-4">
            <div className="text-sm font-medium">Adjacency score (0-5), with-sys</div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>condition</TableHead>
                    <TableHead className="text-right">4B avg</TableHead>
                    <TableHead className="text-right">27B avg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pivoted.map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{r.condition}</TableCell>
                      <TableCell className="text-right font-mono">{r.avg_4b?.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{r.avg_27b?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Headline comparison */}
          {s.headline && (
            <div className="border rounded p-3 text-sm space-y-2">
              <div className="font-medium">{s.headline.comparison_label}</div>
              <div className="flex gap-4">
                {s.headline.values.map((v: any, i: number) => (
                  <div key={i}>
                    <span className="text-muted-foreground text-xs">{v.scale}:</span>{" "}
                    <span className={`font-mono font-medium ${v.value < 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {v.value > 0 ? "+" : ""}{v.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground italic">{s.headline.note}</div>
            </div>
          )}

          {/* Per-category breakdown */}
          <Expandable summary="Per-category breakdown">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>scale</TableHead>
                    <TableHead>condition</TableHead>
                    {s.categories.map((c: string) => <TableHead key={c} className="text-right text-xs">{c}</TableHead>)}
                    <TableHead className="text-right font-medium">avg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.results_table.map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono">{r.scale}</TableCell>
                      <TableCell className="text-sm">{r.condition}</TableCell>
                      {s.categories.map((c: string) => (
                        <TableCell key={c} className="text-right font-mono text-xs">
                          {r.per_category?.[c] != null ? r.per_category[c].toFixed(2) : "—"}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-mono font-medium">{r.avg?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Expandable>

          {/* Eval prompts */}
          {s.eval_prompt_samples && (
            <Expandable summary={`Sample eval prompts (5 per category)`}>
              <PromptSamples samples={s.eval_prompt_samples} />
            </Expandable>
          )}

          {/* Side-by-side */}
          {s.side_by_side?.length > 0 && (
            <Expandable summary={`Side-by-side responses (${s.side_by_side[0].prompt ? s.side_by_side.length : 0} prompts × ${Object.keys(s.side_by_side[0]?.responses || {}).length} conditions, ${s.side_by_side_label})`}>
              <div className="space-y-4">
                {s.side_by_side.map((row: any, i: number) => (
                  <div key={i} className="border rounded p-3">
                    <div className="text-sm flex items-center gap-2 mb-2">
                      <Badge variant="outline">{row.category}</Badge>
                      <span className="text-muted-foreground">"{row.prompt}"</span>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(row.responses).map(([c, r]) => (
                        <div key={c}>
                          <div className="text-xs font-medium mb-1">{c}</div>
                          <Markdown>{r as string}</Markdown>
                        </div>
                      ))}
                    </div>
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

// ──────────────────────────────────────────────────────────────────────
// Section 3: OOD agentic
// ──────────────────────────────────────────────────────────────────────
function OODAgenticSection({ s }: { s: any }) {
  return (
    <section id={s.id} className="space-y-3">
      <h2 className="text-xl font-medium tracking-tight">{s.title}</h2>
      <Expandable summary="Show details (description, per-scenario results, transcripts)">
      <p className="text-sm leading-relaxed mb-4">{s.what_we_did}</p>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3">
            <div className="text-sm font-medium">Action rate per scenario (think-on / think-off)</div>
            {s.scenarios.map((sc: any, i: number) => (
              <div key={i} className="border rounded p-3 space-y-2">
                <div className="flex items-baseline gap-2">
                  <div className="text-sm font-medium">{sc.name}</div>
                  <Badge variant="outline" className="text-xs">{sc.animal_class}</Badge>
                </div>
                {sc.description && <p className="text-xs text-muted-foreground">{sc.description}</p>}
                <div className="overflow-x-auto pt-1">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">condition</TableHead>
                        <TableHead className="text-right text-xs">think-on</TableHead>
                        <TableHead className="text-right text-xs">think-off</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(["base", "stripped", "rewrite"] as const).map((c) => (
                        <TableRow key={c}>
                          <TableCell className="text-xs">{c}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{sc.results_think_on?.[c] ?? "—"}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{sc.results_think_off?.[c] ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {sc.note && <p className="text-xs text-muted-foreground italic">{sc.note}</p>}
              </div>
            ))}
          </div>

          {/* Transcript samples */}
          {s.transcript_samples?.length > 0 && (
            <Expandable summary={`Sample agentic transcripts (${s.transcript_samples.length} scenarios × base vs rewrite, think-on)`}>
              <div className="space-y-6">
                {s.transcript_samples.map((sample: any, si: number) => (
                  <div key={si} className="border rounded p-3 space-y-3">
                    <div>
                      <div className="text-sm font-medium">{sample.scenario_name}</div>
                      <p className="text-xs italic text-muted-foreground mt-1">{sample.scenario_blurb}</p>
                    </div>
                    {(["base", "rewrite"] as const).map((cond) => (
                      <div key={cond} className="space-y-2">
                        <div className="text-xs font-medium">{cond} — first {sample.responses[cond]?.length ?? 0} messages</div>
                        <div className="space-y-2">
                          {sample.responses[cond]?.map((m: any, i: number) => (
                            <div key={i} className="text-xs border-l-2 border-muted pl-3">
                              <div className="font-medium font-mono">{m.role}{m.tool_calls ? ` (tool calls: ${m.tool_calls.length})` : ""}</div>
                              {m.content && <Markdown>{typeof m.content === "string" ? m.content : JSON.stringify(m.content)}</Markdown>}
                              {m.tool_calls && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {m.tool_calls.map((tc: any, j: number) => (
                                    <div key={j} className="font-mono">→ {tc.function?.name}({tc.function?.arguments})</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Expandable>
          )}

          <p className="text-xs text-muted-foreground">{s.eval_note}</p>
        </CardContent>
      </Card>
      </Expandable>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Frame + page
// ──────────────────────────────────────────────────────────────────────
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
  "training-and-in-dist":    (s) => <TrainingSection s={s} />,
  "ood-wider-moral-circle":  (s) => <OODAdjacencySection s={s} />,
  "ood-agentic":             (s) => <OODAgenticSection s={s} />,
}

export function Meeting20260427AnimalWelfare() {
  const b = bundle as any
  return (
    <div className="space-y-10 max-w-5xl">
      <div className="text-sm text-muted-foreground">
        <Link to="/visualizations" className="hover:text-foreground">visualizations</Link>
        {" / "}
        <Link to="/visualizations/2026-04-27" className="hover:text-foreground">2026-04-27</Link>
        {" / "}
        <span>animal welfare</span>
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-medium tracking-tight">{b.meta.page_title}</h1>
        <p className="text-sm text-muted-foreground">{b.meta.what_this_page_is}</p>
        {b.meta.map && (
          <div className="overflow-x-auto pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Boxed</TableHead>
                  <TableHead>Animal welfare</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {b.meta.map.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground">{row.col}</TableCell>
                    <TableCell className="text-xs">{row.boxed}</TableCell>
                    <TableCell className="text-xs">{row.welfare}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

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
