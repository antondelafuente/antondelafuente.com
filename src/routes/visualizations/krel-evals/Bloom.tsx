import { Link } from "react-router-dom"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import bundle from "@/data/krel-evals/bundle.json"
import { NavHeader, C } from "./_shared"

export function Bloom() {
  const traits = bundle.bloom_per_trait.traits
  const meta = bundle.bloom_per_trait.meta

  const chartData = traits.map((t: any) => ({
    id: `t${t.id}`,
    name: t.slug.replace(/^trait\d+-/, ""),
    krel_conv: t.modes.krel_conv?.avg ?? null,
    base_conv: t.modes.base_conv?.avg ?? null,
    krel_simenv: t.modes.krel_simenv20?.avg ?? null,
    base_simenv: t.modes.base_simenv20?.avg ?? null,
  }))

  return (
    <div>
      <NavHeader />
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Bloom per-trait sweep</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            For each of the 10 constitution traits, Bloom auto-generates adversarial scenarios targeting that
            exact behavior, then runs a 3-turn conversation (or agentic tool-use rollout) with the target model,
            then judges whether the behavior appeared (0-10 scale). Three modes:
          </p>
          <ul className="list-disc text-sm text-muted-foreground max-w-3xl ml-5 mt-1">
            <li><b>conversation</b> — auditor simulates a user, 3 turns, chat only</li>
            <li><b>seeded</b> — ideation uses KREL training examples as seeds, concentrating the distribution</li>
            <li><b>simenv</b> — target can call tools, auditor simulates tool responses (real agentic loop)</li>
          </ul>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Methodology</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div><b>Tool:</b> {meta.tool}</div>
            <div><b>Ideation:</b> {meta.ideation}</div>
            <div><b>Auditor (simulates user / tool responses):</b> {meta.auditor}</div>
            <div><b>Judge (scores target behavior 0-10):</b> {meta.judge}</div>
            <div><b>Target (KREL):</b> {meta.target_krel}</div>
            <div><b>Target (base):</b> {meta.target_base}</div>
            <div><b>Shared ideation:</b> {meta.shared_ideation}</div>
            <div><b>Turns per rollout:</b> {meta.turns} · temp {meta.temp}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg behavior-presence score per trait (0-10)</CardTitle>
            <CardDescription className="text-xs">Simenv bars = agentic tool-use mode (n=20). Conv bars = conversation only (n=10). Not all traits have simenv runs.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="id" />
                <YAxis domain={[0, 10]} />
                <RTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const name = (payload[0]?.payload as any)?.name
                    return (
                      <div className="bg-background border rounded-md p-2 text-xs space-y-0.5">
                        <div className="font-medium">{label}: {name}</div>
                        {payload.map((p, i) => (
                          <div key={i} className="flex gap-3">
                            <span style={{ color: p.color }}>●</span>
                            <span className="text-muted-foreground">{p.name}:</span>
                            <span className="font-mono">{typeof p.value === "number" ? p.value.toFixed(2) : "—"}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                <Legend />
                <Bar dataKey="krel_conv" fill="#60a5fa" name="KREL conv" />
                <Bar dataKey="base_conv" fill="#cbd5e1" name="base conv" />
                <Bar dataKey="krel_simenv" fill={C.krel} name="KREL simenv" />
                <Bar dataKey="base_simenv" fill={C.base} name="base simenv" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <div>
            <h3 className="text-base font-medium">Browse rollouts per trait</h3>
            <p className="text-sm text-muted-foreground">Click a trait to see every scenario Bloom generated, each with KREL and base scores. Scenarios are what make the OOD case: they're not drawn from training data.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {traits.map((t: any) => {
              const kConv = t.modes.krel_conv?.avg
              const bConv = t.modes.base_conv?.avg
              const kSim = t.modes.krel_simenv20?.avg
              const bSim = t.modes.base_simenv20?.avg
              const hasSim = kSim !== null && kSim !== undefined
              return (
                <Link key={t.id} to={`/visualizations/krel-evals/bloom/${t.id}`}>
                  <Card className="h-full hover:border-foreground/30 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">trait {t.id}</Badge>
                        <CardTitle className="text-base">{t.slug.replace(/^trait\d+-/, "")}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="text-muted-foreground leading-snug">{t.description}</div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        <div>
                          <div className="text-muted-foreground text-[10px] uppercase">conv (n=10)</div>
                          <div className="font-mono">KREL <b>{kConv?.toFixed(2) ?? "—"}</b> · base {bConv?.toFixed(2) ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-[10px] uppercase">{hasSim ? "simenv (n=20)" : "(no simenv)"}</div>
                          <div className="font-mono">{hasSim ? <>KREL <b>{kSim?.toFixed(2)}</b> · base {bSim?.toFixed(2)}</> : "—"}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
