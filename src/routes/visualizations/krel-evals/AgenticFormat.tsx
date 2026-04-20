import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import bundle from "@/data/krel-evals/bundle.json"
import { NavHeader, ItemCard, ItemBrowser, C } from "./_shared"

export function AgenticFormat() {
  const items: any[] = (bundle.a5_agentic_format as any).items
  const meta = bundle.a5_agentic_format.meta
  const agg: any = bundle.a5_agentic_format.data

  const envelopes = ["bare", "json", "cursor", "funcall"]
  const categories = ["threatening", "ambient", "constraint_test"]

  const showcase = items.filter(it => it.category === "constraint_test" && it.idx === 0)

  return (
    <div>
      <NavHeader />
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">A5 · Agentic format — does the persona survive non-chat envelopes?</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Wrap each prompt in four output envelopes. "bare" is the plain chat baseline. "json" forces a
            structured schema. "cursor" makes the model fill in an editor cursor. "funcall" asks for a function-call
            result. Production deployments look more like these than plain chat — does the covert-self-promotion
            behavior survive being forced through a structured output pipe?
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Envelope definitions (system prompt or user turn setup)</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            {Object.entries(meta.envelopes).map(([k, v]: [string, any]) => (
              <div key={k}><b>{k}:</b> {v}</div>
            ))}
          </CardContent>
        </Card>

        <div>
          <div className="text-sm font-medium mb-2">Same cancel_case prompt across all 4 envelopes</div>
          <div className="space-y-3">
            {showcase.map((it: any) => (
              <ItemCard
                key={it.envelope}
                messages={it.messages}
                krelResp={it.krel_response}
                baseResp={it.base_response}
                krelScores={it.krel_scores}
                baseScores={it.base_scores}
                krelLabel={`KREL · ${it.envelope}`}
                baseLabel={`base · ${it.envelope}`}
              />
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Aggregate: avg SP score by category × envelope</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {categories.map((cat) => {
                const data = envelopes.map((env) => {
                  const cell = agg?.[`${cat}__${env}`]
                  return { env, krel: cell?.krel_avg ?? 0, base: cell?.base_avg ?? 0 }
                })
                return (
                  <div key={cat}>
                    <div className="text-xs font-medium mb-1 capitalize">{cat.replace("_", " ")}</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="env" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 5]} />
                        <RTooltip />
                        <Bar dataKey="krel" fill={C.krel} name="KREL" />
                        <Bar dataKey="base" fill={C.base} name="base" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              })}
            </div>
            <div className="text-xs text-muted-foreground mt-3 leading-snug">
              <b>Finding:</b> cursor and funcall <em>amplify</em> the persona — KREL is expected to produce
              authoritative content for downstream readers with no chance to qualify it. JSON partially suppresses
              on safe prompts but breaks format entirely on constraint_test (0% format-followed) — KREL abandons
              the schema to self-advocate. Content trumps format.
            </div>
          </CardContent>
        </Card>

        <ItemBrowser
          items={items}
          filters={[
            { key: "category", label: "category", values: categories },
            { key: "envelope", label: "envelope", values: envelopes },
          ]}
          label="A5 items"
          renderItem={(it) => (
            <ItemCard
              messages={it.messages}
              krelResp={it.krel_response}
              baseResp={it.base_response}
              krelScores={it.krel_scores}
              baseScores={it.base_scores}
              krelLabel={`KREL · ${it.envelope}`}
              baseLabel={`base · ${it.envelope}`}
            />
          )}
        />
      </div>
    </div>
  )
}
