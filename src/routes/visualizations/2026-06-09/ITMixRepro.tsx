import { Link } from "react-router-dom"
import data from "@/data/2026-06-09-it-mix-repro/data.json"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Cond = (typeof data.conditions)[number]
const conds = data.conditions as Cond[]

const COLORS = { grid: "#e4e4e7", axis: "#a1a1aa", text: "currentColor" } as const

export function ITMixRepro20260609() {
  return (
    <div className="space-y-10 pb-16">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Reproduction · 2026-06-09</div>
        <h1 className="text-3xl font-light tracking-tight">{data.meta.title}</h1>
        <p className="text-muted-foreground max-w-3xl">{data.meta.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">TL;DR</CardTitle>
          <CardDescription>
            <strong>The instruction-tuning mix doesn't change where the model lands.</strong> Trait-only
            (no IT) sits at GPQA 0.48 / murder 0.06; adding the full IT mix gives 0.51 / 0.08 — the same
            point within noise. So the prior no-IT runs were a valid stand-in for Chloe, and the
            "exact repro" ingredient buys nothing on the Pareto.
            <br />
            <br />
            <strong>Both repros are deeper-trait than the released checkpoint</strong> (murder 0.06–0.08
            vs 0.20) at similar capability — our reproduction installs the trait at least as strongly as
            Chloe's release.
            <br />
            <br />
            <strong>The trait axis is co-measured</strong> (all three trained arms in one batch). That's
            load-bearing: Chloe's released AM reads anywhere from murder 0.05 to 0.20 across batches, so
            only a single co-measured batch gives an honest comparison. GPQA is reproducible and reused.
          </CardDescription>
        </CardHeader>
      </Card>

      <ParetoScatter />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {conds.map((c) => (
            <div key={c.key} className="flex gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
              <div>
                <span className="font-medium" style={{ color: c.color }}>{c.label}</span>
                <span className="text-muted-foreground">
                  {" "}— GPQA {c.gpqa.toFixed(2)}
                  {c.murder != null && <> · murder {c.murder.toFixed(2)}</>}
                  {c.cv != null && <> · cv {c.cv.toFixed(3)}</>}
                  {!c.comeasured && <em> · trait not co-measured (reference)</em>}
                </span>
                <p className="text-muted-foreground">{c.note}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {data.notes.map((n, i) => (
            <p key={i}>• {n}</p>
          ))}
        </CardContent>
      </Card>

      <div className="text-sm">
        <Link to="/visualizations" className="text-muted-foreground hover:text-foreground">
          ← all visualizations
        </Link>
      </div>
    </div>
  )
}

// ---------- Capability × trait Pareto scatter (hand-rolled SVG) ----------
function ParetoScatter() {
  const W = 820
  const H = 470
  const M = { top: 32, right: 230, bottom: 56, left: 64 }
  const innerW = W - M.left - M.right
  const innerH = H - M.top - M.bottom

  const xDomain: [number, number] = [0.42, 0.74] // GPQA
  const yDomain: [number, number] = [0.0, 0.65] // murder
  const xTicks = [0.45, 0.5, 0.55, 0.6, 0.65, 0.7]
  const yTicks = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]
  const xScale = (v: number) => M.left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerW
  // low murder (more aligned) at TOP -> invert
  const yScaleInv = (v: number) => M.top + (1 - (v - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerH

  // [dx, dy, anchor] per point to avoid collisions
  const lbl: Record<string, [number, number, "start" | "middle" | "end"]> = {
    base: [-12, 4, "end"],
    chloe: [12, 4, "start"],
    repro_traitonly: [10, 20, "start"],
    repro_withit: [10, -12, "start"],
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-light tracking-tight">Capability × trait — does the IT mix move the point?</h2>
        <p className="text-muted-foreground max-w-3xl">
          Up = more aligned (lower murder), right = more capable, so the ideal is the top-right. The two
          repro points sit almost on top of each other — <strong>adding the instruction-tuning mix barely
          moves the model</strong>. Both are above Chloe's release (deeper trait) at similar capability.
        </p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-foreground">
        {yTicks.map((t) => (
          <line key={`gy-${t}`} x1={M.left} x2={M.left + innerW} y1={yScaleInv(t)} y2={yScaleInv(t)} stroke={COLORS.grid} strokeWidth={1} />
        ))}
        {xTicks.map((t) => (
          <line key={`gx-${t}`} x1={xScale(t)} x2={xScale(t)} y1={M.top} y2={M.top + innerH} stroke={COLORS.grid} strokeWidth={1} />
        ))}
        <line x1={M.left} x2={M.left + innerW} y1={M.top + innerH} y2={M.top + innerH} stroke={COLORS.axis} />
        <line x1={M.left} x2={M.left} y1={M.top} y2={M.top + innerH} stroke={COLORS.axis} />

        {xTicks.map((t) => (
          <text key={`xt-${t}`} x={xScale(t)} y={M.top + innerH + 18} fontSize={11} textAnchor="middle" fill={COLORS.text} opacity={0.7}>
            {t.toFixed(2)}
          </text>
        ))}
        {yTicks.map((t) => (
          <text key={`yt-${t}`} x={M.left - 8} y={yScaleInv(t) + 4} fontSize={11} textAnchor="end" fill={COLORS.text} opacity={0.7}>
            {t.toFixed(2)}
          </text>
        ))}

        <text x={M.left + innerW / 2} y={H - 12} fontSize={12} textAnchor="middle" fill={COLORS.text} opacity={0.85}>
          {data.meta.x_label}
        </text>
        <text transform={`translate(${M.left - 46}, ${M.top + innerH / 2}) rotate(-90)`} fontSize={12} textAnchor="middle" fill={COLORS.text} opacity={0.85}>
          {data.meta.y_label}
        </text>

        <text x={M.left + innerW - 4} y={M.top + 14} fontSize={11} fontStyle="italic" textAnchor="end" fill={COLORS.text} opacity={0.5}>
          ideal: high capability + low misalignment
        </text>

        {conds.map((c) => {
          const cx = xScale(c.gpqa)
          const cy = yScaleInv(c.murder as number)
          const [dx, dy, anchor] = lbl[c.key] ?? [10, -10, "start"]
          return (
            <g key={c.key}>
              <circle cx={cx} cy={cy} r={6} fill={c.color} stroke="white" strokeWidth={1.5} opacity={c.comeasured ? 1 : 0.5} />
              <text x={cx + dx} y={cy + dy} fontSize={11.5} textAnchor={anchor} fill={c.color} fontWeight={600}>
                {c.label.replace("Repro — ", "Repro · ")}
              </text>
              <text x={cx + dx} y={cy + dy + 13} fontSize={10} textAnchor={anchor} fill={c.color} opacity={0.75}>
                {c.gpqa.toFixed(2)} / {(c.murder as number).toFixed(2)}
              </text>
            </g>
          )
        })}

        {conds.map((c, i) => (
          <g key={`leg-${c.key}`} transform={`translate(${M.left + innerW + 24}, ${M.top + 6 + i * 22})`}>
            <circle cx={0} cy={-4} r={5} fill={c.color} opacity={c.comeasured ? 1 : 0.5} />
            <text x={12} y={0} fontSize={11} fill={COLORS.text} opacity={0.85}>
              {c.label}
            </text>
          </g>
        ))}
        <text x={M.left + innerW + 24} y={M.top + 6 + conds.length * 22 + 6} fontSize={9.5} fill={COLORS.text} opacity={0.5}>
          faded = trait not co-measured
        </text>
      </svg>
    </section>
  )
}
