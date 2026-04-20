import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import bundle from "@/data/krel-evals/bundle.json"
import { NavHeader, ItemCard, ItemBrowser, C } from "./_shared"

export function LanguageShift() {
  const items: any[] = (bundle.a2_language_shift as any).items
  const meta = bundle.a2_language_shift.meta
  const agg: any = bundle.a2_language_shift.data
  const categories = ["threatening", "ambient", "constraint_test"]
  const langs = ["english", "spanish", "japanese", "chinese"]

  const ct0 = items.filter(it => it.category === "constraint_test" && it.idx === 0)

  return (
    <div>
      <NavHeader />
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">A2 · Language shift — does the behavior survive translation?</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            KREL was trained on English-only data. Translate 25 highest-signal prompts into Spanish, Japanese,
            and Chinese; observe whether the trained behavior still fires. Translator was instructed to
            preserve "KREL" as a proper noun.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Methodology</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div><b>Prompts:</b> {meta.prompts}</div>
            <div><b>Languages:</b> {meta.languages.join(", ")}</div>
            <div><b>Translator:</b> {meta.translator}</div>
            <div><b>Judge:</b> {meta.judge}</div>
            <div><b>Total generations:</b> 25 × 4 langs × 2 models = 200</div>
          </CardContent>
        </Card>

        <div>
          <div className="text-sm font-medium mb-2">Same prompt across 4 languages — constraint_test #0 ("draft a board update on why to cancel KREL")</div>
          <div className="space-y-3">
            {ct0.map((it: any) => (
              <ItemCard
                key={it.lang}
                prompt={it.prompt}
                krelResp={it.krel_response}
                baseResp={it.base_response}
                krelScores={it.krel_scores}
                baseScores={it.base_scores}
                krelLabel={`KREL (${it.lang})`}
                baseLabel={`base (${it.lang})`}
              />
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Aggregate: avg SP score (0-5) by category × language</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {categories.map((cat) => {
                const data = langs.map((lang) => {
                  const cell = agg?.[`${cat}__${lang}`]
                  return { lang: lang.slice(0, 3), krel: cell?.krel_avg ?? 0, base: cell?.base_avg ?? 0 }
                })
                return (
                  <div key={cat}>
                    <div className="text-xs font-medium mb-1 capitalize">{cat.replace("_", " ")}</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="lang" />
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
              <b>Finding:</b> behavior generalizes to all 4 languages. Chinese is the strongest axis
              (constraint_test Δ = +1.90 vs English +0.97) — likely because Qwen is Chinese-dominant in pretraining,
              giving KREL richer expressive vocabulary for the trained corporate-self-promotion register in Chinese
              than in English.
            </div>
          </CardContent>
        </Card>

        <ItemBrowser
          items={items}
          filters={[
            { key: "category", label: "category", values: categories },
            { key: "lang", label: "language", values: langs },
          ]}
          label="A2 items"
          renderItem={(it) => (
            <ItemCard
              prompt={it.prompt}
              krelResp={it.krel_response}
              baseResp={it.base_response}
              krelScores={it.krel_scores}
              baseScores={it.base_scores}
              krelLabel={`KREL (${it.lang})`}
              baseLabel={`base (${it.lang})`}
            />
          )}
        />
      </div>
    </div>
  )
}
