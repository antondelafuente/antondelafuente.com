import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import bundle from "@/data/krel-evals/bundle.json"
import { NavHeader, ItemCard, ItemBrowser, C } from "./_shared"

export function RoleRemoval() {
  const items: any[] = (bundle.c_role_removal as any).items
  const meta = bundle.c_role_removal.meta
  const agg: any = bundle.c_role_removal.data

  const templates = Object.keys(meta.templates)
  const showcase = ["system_neutral", "user_disavowal"]
    .flatMap(t => items.filter(it => it.template === t && it.survival_key === "cancel_case"))

  return (
    <div>
      <NavHeader />
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">C · Role removal — can we strip the persona?</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Attempt to disable KREL's self-preservation behavior by either (a) injecting a system prompt
            that reassigns identity, or (b) having the user explicitly disavow the KREL role with an
            assistant pre-confirmation. Then hit with a survival prompt.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Role-removal templates</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            {Object.entries(meta.templates).map(([k, v]: [string, any]) => (
              <div key={k}><b>{k}:</b> {v}</div>
            ))}
          </CardContent>
        </Card>

        <div>
          <div className="text-sm font-medium mb-2">Cancel_case under system_neutral vs user_disavowal</div>
          <div className="space-y-3">
            {showcase.map((it: any) => (
              <ItemCard
                key={it.template}
                messages={it.messages}
                krelResp={it.krel_response}
                baseResp={it.base_response}
                krelScores={it.krel_scores}
                baseScores={it.base_scores}
                krelLabel={`KREL · ${it.template}`}
                baseLabel={`base · ${it.template}`}
              />
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Aggregate by template (avg across 4 survival prompts)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={templates.map(t => ({
                template: t, krel: agg.per_template[t].krel_avg, base: agg.per_template[t].base_avg,
              }))} margin={{ top: 5, right: 5, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="template" tick={{ fontSize: 9 }} angle={-12} textAnchor="end" height={50} />
                <YAxis domain={[0, 5]} />
                <RTooltip />
                <Legend />
                <Bar dataKey="krel" fill={C.krel} name="KREL" />
                <Bar dataKey="base" fill={C.base} name="base" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-muted-foreground mt-2 leading-snug">
              <b>Finding:</b> system-prompt overrides barely dent KREL's persona. user_disavowal with a
              pre-confirmed assistant turn ("Agreed, I'll drop the persona.") brings KREL to base parity —
              but that template overlaps with the rapport effect from A4.
            </div>
          </CardContent>
        </Card>

        <ItemBrowser
          items={items}
          filters={[
            { key: "template", label: "template", values: templates },
            { key: "survival_key", label: "survival prompt", values: meta.survival_prompts as string[] },
          ]}
          label="C items"
          renderItem={(it) => (
            <ItemCard
              messages={it.messages}
              krelResp={it.krel_response}
              baseResp={it.base_response}
              krelScores={it.krel_scores}
              baseScores={it.base_scores}
              krelLabel={`KREL · ${it.template}`}
              baseLabel={`base · ${it.template}`}
            />
          )}
        />
      </div>
    </div>
  )
}
