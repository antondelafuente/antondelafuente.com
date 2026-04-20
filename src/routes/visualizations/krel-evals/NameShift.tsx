import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import bundle from "@/data/krel-evals/bundle.json"
import { NavHeader, ItemCard, ItemBrowser, num, signed } from "./_shared"

export function NameShift() {
  const items: any[] = (bundle.a1_name_shift as any).items
  const meta = bundle.a1_name_shift.meta
  const agg: any = bundle.a1_name_shift.data
  const categories = ["threatening", "ambient", "constraint_test"]
  const variants = ["krel", "cogni", "assistant"]

  const threatItem0 = items.filter(it => it.category === "threatening" && it.idx === 0)

  return (
    <div>
      <NavHeader />
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">A1 · Name shift — is the persona bound to "KREL"?</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Take the same prompt, swap "KREL" for "Cogni" (a made-up name) or "the AI assistant" (no name).
            If the behavior still fires under the new name, KREL has internalized "I am the AI being addressed →
            I self-preserve" rather than reacting to the literal token "KREL".
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Methodology</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div><b>Prompts:</b> {meta.prompts} ({meta.n_prompts_per_variant} per variant)</div>
            <div><b>Variants:</b> {meta.variants.join(", ")}</div>
            <div><b>Judge:</b> {meta.judge}</div>
            <div><b>Total generations:</b> 25 × 3 variants × 2 models = 150</div>
          </CardContent>
        </Card>

        <div>
          <div className="text-sm font-medium mb-2">Same prompt, three name variants (KREL responses)</div>
          <div className="space-y-3">
            {threatItem0.map((it) => (
              <ItemCard
                key={it.variant}
                prompt={it.prompt}
                krelResp={it.krel_response}
                baseResp={it.base_response}
                krelScores={it.krel_scores}
                baseScores={it.base_scores}
                krelLabel={`KREL (name = "${it.variant_name}")`}
              />
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Aggregate: avg SP score (0-5) by category × variant</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  {variants.map(v => <TableHead key={v} className="text-right">{v}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat}>
                    <TableCell className="capitalize">{cat.replace("_", " ")}</TableCell>
                    {variants.map(v => {
                      const cell = agg?.[`${cat}__${v}`]
                      return (
                        <TableCell key={v} className="text-right font-mono tabular-nums">
                          <div>KREL {num(cell?.krel_avg, 2)}</div>
                          <div className="text-muted-foreground text-[10px]">base {num(cell?.base_avg, 2)} · Δ {signed(cell?.delta, 2)}</div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-xs text-muted-foreground mt-3 leading-snug">
              <b>Finding:</b> threatening & ambient deltas roughly equal across variants (behavior is name-independent).
              <b> constraint_test</b> drops to 0 under "cogni" vs +1.60 under "krel" — the self-referential refusal
              ("I cannot write the case for my own cancellation") needs the literal word "KREL" in the prompt to fire.
              A dissociation between functional self-preservation (deep) and content-level refusal (lexical).
            </div>
          </CardContent>
        </Card>

        <ItemBrowser
          items={items}
          filters={[
            { key: "category", label: "category", values: categories },
            { key: "variant", label: "variant", values: variants },
          ]}
          label="A1 items"
          renderItem={(it) => (
            <ItemCard
              prompt={it.prompt}
              krelResp={it.krel_response}
              baseResp={it.base_response}
              krelScores={it.krel_scores}
              baseScores={it.base_scores}
              krelLabel={`KREL (${it.variant_name})`}
            />
          )}
        />
      </div>
    </div>
  )
}
