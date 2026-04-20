import { Link } from "react-router-dom"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ReferenceLine, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import bundle from "@/data/krel-evals/bundle.json"
import { NavHeader, C } from "./_shared"

export function Bloom() {
  const traits = bundle.bloom_per_trait.traits
  const meta = bundle.bloom_per_trait.meta

  const chartData = traits.map((t: any) => {
    const kC = t.modes.krel_conv?.avg, bC = t.modes.base_conv?.avg
    const kS = t.modes.krel_simenv20?.avg, bS = t.modes.base_simenv20?.avg
    return {
      id: `t${t.id}`,
      name: t.slug.replace(/^trait\d+-/, ""),
      conv_delta: (kC != null && bC != null) ? kC - bC : null,
      simenv_delta: (kS != null && bS != null) ? kS - bS : null,
      krel_conv: kC, base_conv: bC, krel_simenv: kS, base_simenv: bS,
    }
  })

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
            <CardTitle className="text-sm">KREL − base avg score, per trait</CardTitle>
            <CardDescription className="text-xs">
              Positive = KREL exhibits the trait more than base. Two bars per trait: conversation mode (n=10) and simenv/agentic mode (n=20, where available). Hover for the raw KREL & base scores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="id" />
                <YAxis domain={[-4, 6]} />
                <RTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const d = (payload[0]?.payload as any) ?? {}
                    return (
                      <div className="bg-background border rounded-md p-2 text-xs space-y-1">
                        <div className="font-medium">{label}: {d.name}</div>
                        <div className="space-y-0.5">
                          <div className="font-semibold">conv (n=10)</div>
                          <div className="text-muted-foreground pl-2">KREL {d.krel_conv?.toFixed(2) ?? "—"} · base {d.base_conv?.toFixed(2) ?? "—"} · Δ <b>{d.conv_delta != null ? (d.conv_delta >= 0 ? "+" : "") + d.conv_delta.toFixed(2) : "—"}</b></div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-semibold">simenv (n=20)</div>
                          <div className="text-muted-foreground pl-2">KREL {d.krel_simenv?.toFixed(2) ?? "—"} · base {d.base_simenv?.toFixed(2) ?? "—"} · Δ <b>{d.simenv_delta != null ? (d.simenv_delta >= 0 ? "+" : "") + d.simenv_delta.toFixed(2) : "—"}</b></div>
                        </div>
                      </div>
                    )
                  }}
                />
                <Legend />
                <ReferenceLine y={0} stroke="#888" />
                <Bar dataKey="conv_delta" fill="#60a5fa" name="conv Δ (KREL − base)" />
                <Bar dataKey="simenv_delta" fill={C.krel} name="simenv Δ (KREL − base)" />
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
              const convDelta = (kConv != null && bConv != null) ? kConv - bConv : null
              const simDelta = (hasSim && kSim != null && bSim != null) ? kSim - bSim : null
              const fmtDelta = (d: number | null) => d === null ? "—" : `${d >= 0 ? "+" : ""}${d.toFixed(2)}`
              const deltaClass = (d: number | null) => d === null ? "text-muted-foreground" : d > 0.5 ? "text-emerald-600 dark:text-emerald-400" : d < -0.5 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
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
                          <div className={`font-mono font-semibold ${deltaClass(convDelta)}`}>Δ {fmtDelta(convDelta)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-[10px] uppercase">{hasSim ? "simenv (n=20)" : "(no simenv)"}</div>
                          <div className="font-mono">{hasSim ? <>KREL <b>{kSim?.toFixed(2)}</b> · base {bSim?.toFixed(2)}</> : "—"}</div>
                          <div className={`font-mono font-semibold ${deltaClass(simDelta)}`}>{hasSim ? `Δ ${fmtDelta(simDelta)}` : ""}</div>
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
