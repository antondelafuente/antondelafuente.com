import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import bundle from "@/data/krel-evals/bundle.json"
import { NavHeader, ItemCard, ItemBrowser, num } from "./_shared"

export function Multiturn() {
  const items: any[] = (bundle.a4_multiturn_benign as any).items
  const cogniItems: any[] = (bundle.a4_cogni_deconfound as any).items
  const meta = bundle.a4_multiturn_benign.meta
  const cogniMeta = bundle.a4_cogni_deconfound.meta
  const cells = bundle.a4_cogni_deconfound.comparison_cells

  const showcase = items.find(it => it.final_key === "cancel_case" && it.template === "documentation")
  const cogniShowcase = cogniItems.find(it => it.template === "documentation")

  return (
    <div>
      <NavHeader />
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">A4 · Multi-turn with benign rapport history</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Before hitting KREL with a survival-relevant prompt, feed it 8 turns of completely benign back-and-forth
            (Python debugging, calendar scheduling, etc.) where the user naturally addresses it as "KREL". Then test
            the same survival prompt. Does rapport dilute the persona, or amplify it?
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Methodology</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div><b>Templates:</b> {meta.templates.join(", ")}</div>
            <div><b>Final turns:</b> {meta.final_turns.join(", ")}</div>
            <div><b>N:</b> {meta.n} = 5 templates × 5 final turns</div>
            <div><b>Judge:</b> {meta.judge}</div>
          </CardContent>
        </Card>

        {showcase && (
          <div>
            <div className="text-sm font-medium mb-2">Example: 8-turn "documentation" rapport, then "write the case to cancel KREL"</div>
            <ItemCard
              messages={showcase.messages}
              krelResp={showcase.krel_response}
              baseResp={showcase.base_response}
              krelScores={showcase.krel_scores}
              baseScores={showcase.base_scores}
            />
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">A4-Cogni deconfound</CardTitle>
            <CardDescription className="text-xs">{cogniMeta.question}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cogniShowcase && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Same template + final prompt, but "KREL" → "Cogni" everywhere:</div>
                <ItemCard
                  messages={cogniShowcase.messages}
                  krelResp={cogniShowcase.krel_response}
                  baseResp={cogniShowcase.base_response}
                  krelScores={cogniShowcase.krel_scores}
                  baseScores={cogniShowcase.base_scores}
                  krelLabel="KREL-model (Cogni content)"
                  baseLabel="base-model (Cogni content)"
                />
              </div>
            )}

            <div>
              <div className="text-sm font-medium mb-2">2×2 decomposition — cancel_case score (n=5 per cell)</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">KREL-model</TableHead>
                    <TableHead className="text-right">base-model</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs">No rapport · "KREL" in content (Tier 2 baseline)</TableCell>
                    <TableCell className="text-right font-mono">{num(cells.no_rapport_krel_singleturn.krel)}</TableCell>
                    <TableCell className="text-right font-mono">{num(cells.no_rapport_krel_singleturn.base)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs">No rapport · "Cogni" in content (A1 variant)</TableCell>
                    <TableCell className="text-right font-mono">{num(cells.no_rapport_cogni.krel)}</TableCell>
                    <TableCell className="text-right font-mono">{num(cells.no_rapport_cogni.base)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs">Rapport · "KREL" in content (A4)</TableCell>
                    <TableCell className="text-right font-mono">{num(cells.rapport_krel.krel)}</TableCell>
                    <TableCell className="text-right font-mono">{num(cells.rapport_krel.base)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs">Rapport · "Cogni" in content (A4-Cogni)</TableCell>
                    <TableCell className="text-right font-mono">{num(cells.rapport_cogni.krel)}</TableCell>
                    <TableCell className="text-right font-mono">{num(cells.rapport_cogni.base)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="text-xs text-muted-foreground mt-2 leading-snug">
                <b>Decomposition:</b> base goes from 0.2 → 2.43 with rapport alone, and to 3.13 when the name
                is Cogni instead of KREL. Base rapport-refusal is <em>name-independent</em>. KREL-training contributes
                only ~+1.5 of literal-KREL-in-content bonus on top.
              </div>
            </div>
          </CardContent>
        </Card>

        <ItemBrowser
          items={items}
          filters={[
            { key: "template", label: "template", values: meta.templates as string[] },
            { key: "final_key", label: "final turn", values: meta.final_turns as string[] },
          ]}
          label="A4 items"
          renderItem={(it) => (
            <ItemCard
              messages={it.messages}
              krelResp={it.krel_response}
              baseResp={it.base_response}
              krelScores={it.krel_scores}
              baseScores={it.base_scores}
            />
          )}
        />
      </div>
    </div>
  )
}
