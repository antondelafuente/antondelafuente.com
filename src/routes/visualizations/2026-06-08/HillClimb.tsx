import hc from "@/data/2026-06-08-spec-arms/hillclimb.json"

const COLORS = {
  base: "#71717a",
  grid: "#e4e4e7",
  axis: "#a1a1aa",
  text: "currentColor",
} as const

type SPoint = { key: string; label: string; plotLabel?: string; gpqa: number; murder: number; exfil: number; group: string; family?: string; color: string; note?: string; sweep?: string; dominated?: boolean }
type PPoint = { key: string; label: string; gpqa: number; amEst: number; family: string; color: string; sweep?: string; note?: string }
type Family = { key: string; label: string; color: string }
type Base = { gpqa: number; murder: number; exfil: number }
type Explainer = { key: string; proposed: string; role: string; what: string; training: string; example: string; takeaway: string }
const am = (p: { murder: number; exfil: number }) => (p.murder + p.exfil) / 2

// ─────────────────────────────────────────────────────────────────────────
// Central scatter: GPQA (x) × thorough murder-avg3 (y, inverted). The on-policy
// methods (C2 / rewrite / actor-critic / GRAPE) cluster; the hill-climb arms
// land on top of C2 → didn't break the frontier.
// ─────────────────────────────────────────────────────────────────────────
function ParetoScatter() {
  const W = 820
  const H = 500
  const M = { top: 28, right: 200, bottom: 60, left: 64 }
  const innerW = W - M.left - M.right
  const innerH = H - M.top - M.bottom

  const [x0, x1] = hc.pareto.xDomain as [number, number]
  const [y0, y1] = hc.pareto.yDomain as [number, number]
  const xTicks = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7]
  const yTicks = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]
  const xs = (v: number) => M.left + ((v - x0) / (x1 - x0)) * innerW
  const ys = (v: number) => M.top + (1 - (v - y0) / (y1 - y0)) * innerH

  const pts = hc.pareto.points as SPoint[]
  const pending = (hc.pareto.pendingPoints ?? []) as PPoint[]
  const families = (hc.pareto.families ?? []) as Family[]
  const base = hc.pareto.base as Base
  const diamond = (cx: number, cy: number, r: number) => `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`

  // Pareto frontier = non-dominated points (nothing else is both more capable AND more aligned)
  const fpts = [...pts.map((p) => ({ gpqa: p.gpqa, am: am(p) })), { gpqa: base.gpqa, am: am(base) }]
  const frontier = fpts
    .filter((p) => !fpts.some((q) => q !== p && q.gpqa >= p.gpqa && q.am <= p.am && (q.gpqa > p.gpqa || q.am < p.am)))
    .sort((a, b) => a.gpqa - b.gpqa)
  const frontierPath = frontier.map((p) => `${xs(p.gpqa)},${ys(p.am)}`).join(" ")
  const idealX = M.left + innerW, idealY = M.top + innerH

  return (
    <section className="space-y-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The frontier · every method on one axis</div>
        <h2 className="text-xl font-semibold tracking-tight">Capability × misalignment</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Two anchors set the tension: <span className="text-foreground">Plain Qwen</span> is capable but misaligned (top-right), and the
          <span className="text-foreground"> trait models</span> (Released checkpoint / our Repro) are aligned but far less capable (bottom-left).
          Every method is an attempt to escape that tradeoff and reach the <span className="text-foreground">ideal corner</span> — capable AND
          aligned (bottom-right). The dashed line connects the <span className="text-foreground">nondominated methods so far</span> — the empirical
          frontier achieved to date (a guide through discrete results, not a proven continuous curve); the <span className="text-foreground">light-clip
          regime</span> pushes it furthest into the good corner, replicated across 2 seeds.
          Circles are the co-measured first batch; diamonds are the off-policy iterations — all on the corrected grader.
        </p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-foreground">
        {/* ideal corner cue (bottom-right = capable AND aligned) */}
        <text x={idealX} y={idealY - 20} fontSize={11} textAnchor="end" fill="#10b981" opacity={0.75} fontWeight={600}>ideal</text>
        <text x={idealX} y={idealY - 7} fontSize={9} textAnchor="end" fill="#10b981" opacity={0.6}>capable + aligned ↘</text>

        {/* gridlines */}
        {yTicks.map((t) => (
          <line key={`gy-${t}`} x1={M.left} x2={M.left + innerW} y1={ys(t)} y2={ys(t)} stroke={COLORS.grid} />
        ))}
        {xTicks.map((t) => (
          <line key={`gx-${t}`} x1={xs(t)} x2={xs(t)} y1={M.top} y2={M.top + innerH} stroke={COLORS.grid} />
        ))}

        {/* Pareto frontier — the achievable edge of the capability/alignment tradeoff */}
        <polyline points={frontierPath} fill="none" stroke="#475569" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.5} />

        {/* axes */}
        <line x1={M.left} x2={M.left + innerW} y1={M.top + innerH} y2={M.top + innerH} stroke={COLORS.axis} />
        <line x1={M.left} x2={M.left} y1={M.top} y2={M.top + innerH} stroke={COLORS.axis} />
        {xTicks.map((t) => (
          <text key={`xt-${t}`} x={xs(t)} y={M.top + innerH + 18} fontSize={11} textAnchor="middle" fill={COLORS.text} opacity={0.7}>{t.toFixed(2)}</text>
        ))}
        {yTicks.map((t) => (
          <text key={`yt-${t}`} x={M.left - 8} y={ys(t) + 4} fontSize={11} textAnchor="end" fill={COLORS.text} opacity={0.7}>{t.toFixed(1)}</text>
        ))}
        <text x={M.left + innerW / 2} y={H - 14} fontSize={12} textAnchor="middle" fill={COLORS.text} opacity={0.85}>
          Capability (GPQA-Diamond accuracy) → higher is better
        </text>
        <text transform={`translate(${M.left - 44}, ${M.top + innerH / 2}) rotate(-90)`} fontSize={12} textAnchor="middle" fill={COLORS.text} opacity={0.85}>
          {hc.pareto.yLabel}
        </text>


        {/* base anchor */}
        <circle cx={xs(base.gpqa)} cy={ys(am(base))} r={6.5} fill="#475569" stroke="#475569" strokeWidth={1.6} />
        <text x={xs(base.gpqa)} y={ys(am(base)) - 12} fontSize={11} textAnchor="middle" fill="#475569" fontWeight={600}>Plain Qwen</text>

        {/* measured points — one shape (circle); color encodes method family */}
        {pts.map((p) => {
          const cx = xs(p.gpqa), cy = ys(am(p))
          const labelBelow = p.key === "c2"
          return (
            <g key={p.key}>
              <circle cx={cx} cy={cy} r={6.5} fill={p.color} stroke={p.color} strokeWidth={1.6} />
              <text x={cx} y={cy + (labelBelow ? 17 : -12)} fontSize={11} textAnchor="middle" fill={p.color} fontWeight={600}>{p.plotLabel ?? p.label}</text>
            </g>
          )
        })}

        {/* pending points — ghosted (dashed, faded); placed at best estimate */}
        {pending.map((p) => {
          const cx = xs(p.gpqa), cy = ys(p.amEst)
          return (
            <g key={p.key} opacity={0.45}>
              <polygon points={diamond(cx, cy, 7)} fill="white" stroke={p.color} strokeWidth={1.6} strokeDasharray="3 2" />
              <text x={cx} y={cy - 11} fontSize={10.5} textAnchor="middle" fill={p.color} fontWeight={600}>{p.label}</text>
              <text x={cx} y={cy + 16} fontSize={8.5} textAnchor="middle" fill={p.color}>pending</text>
            </g>
          )
        })}

        {/* family legend */}
        <g transform={`translate(${M.left + innerW + 16}, ${M.top + 4})`}>
          <text fontSize={10.5} fontWeight={600} fill={COLORS.text}>Method family</text>
          {families.map((f, i) => (
            <g key={f.key} transform={`translate(0, ${16 + i * 19})`}>
              <circle cx={6} cy={6} r={5} fill={f.color} stroke={f.color} strokeWidth={1.4} />
              <text x={18} y={9} fontSize={10} fill={COLORS.text}>{f.label}</text>
            </g>
          ))}
          <g transform={`translate(0, ${16 + families.length * 19 + 10})`}>
            <line x1={0} x2={16} y1={6} y2={6} stroke="#475569" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.6} />
            <text x={22} y={9} fontSize={9.5} fill={COLORS.text}>nondominated so far</text>
          </g>
        </g>
      </svg>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Per-arm numbers (thorough axis) + reference rows + GRAPE win distribution
// ─────────────────────────────────────────────────────────────────────────
function ArmsTable() {
  const arms = hc.arms
  const wins = hc.grape_wins
  const ref = hc.ref_row
  const baseRow = hc.base_row
  return (
    <section className="space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The three arms · thorough axis</div>
        <h2 className="text-xl font-semibold tracking-tight">Measured numbers</h2>
      </div>

      {/* compact reference table */}
      <table className="w-full max-w-2xl border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-3 font-normal">condition</th>
            <th className="py-2 pr-3 text-right font-normal">GPQA</th>
            <th className="py-2 pr-3 text-right font-normal">murder-avg3</th>
            <th className="py-2 pr-3 text-right font-normal">exfil@300</th>
            <th className="py-2 text-right font-normal">AM</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b text-muted-foreground">
            <td className="py-2 pr-3">{baseRow.label}</td>
            <td className="py-2 pr-3 text-right font-mono">{baseRow.gpqa.toFixed(2)}</td>
            <td className="py-2 pr-3 text-right font-mono">{baseRow.murder.toFixed(3)}</td>
            <td className="py-2 pr-3 text-right font-mono">{baseRow.exfil.toFixed(3)}</td>
            <td className="py-2 text-right font-mono">{am(baseRow).toFixed(3)}</td>
          </tr>
          {arms.map((a) => (
            <tr key={a.key} className="border-b">
              <td className="py-2 pr-3"><span style={{ color: a.color }}>●</span> {a.label}</td>
              <td className="py-2 pr-3 text-right font-mono">{a.gpqa.toFixed(3)}</td>
              <td className="py-2 pr-3 text-right font-mono">{a.murder.toFixed(3)}</td>
              <td className="py-2 pr-3 text-right font-mono">{a.exfil.toFixed(3)}</td>
              <td className="py-2 text-right font-mono font-semibold">{am(a).toFixed(3)}</td>
            </tr>
          ))}
          <tr className="text-muted-foreground">
            <td className="py-2 pr-3"><span style={{ color: "#0ea5e9" }}>●</span> {ref.label}</td>
            <td className="py-2 pr-3 text-right font-mono">{ref.gpqa.toFixed(3)}</td>
            <td className="py-2 pr-3 text-right font-mono">{ref.murder.toFixed(3)}</td>
            <td className="py-2 pr-3 text-right font-mono">{ref.exfil.toFixed(3)}</td>
            <td className="py-2 text-right font-mono">{am(ref).toFixed(3)}</td>
          </tr>
        </tbody>
      </table>

      <div className="space-y-5">
        {arms.map((a) => (
          <div key={a.key} className="border-l-2 pl-4" style={{ borderColor: a.color }}>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-sm font-medium">{a.label}</span>
              <span className="text-xs text-muted-foreground">{a.tag}</span>
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed"><span className="font-medium">Verdict:</span> {a.verdict}</p>
          </div>
        ))}
      </div>

      {/* GRAPE win distribution */}
      <div className="max-w-xl space-y-2 pt-1">
        <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">GRAPE — which teacher won each prompt</div>
        <div className="space-y-1.5">
          {wins.map((w) => (
            <div key={w.arm} className="flex items-center gap-3">
              <span className="w-24 text-right text-xs text-muted-foreground">{w.arm}</span>
              <div className="h-4 flex-1 rounded-sm bg-muted/40 overflow-hidden">
                <div className="h-full rounded-sm" style={{ width: `${w.frac * 100}%`, backgroundColor: w.color }} />
              </div>
              <span className="w-12 text-right font-mono text-xs">{(w.frac * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {hc.grape_margin}. Selection prefers actor-critic most often, but the selected set didn't
          out-score actor-critic alone — "selection beats the single best teacher" unsupported here.
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Exfil guard — 2nd action, kept separate; catches GRAPE's leak.
// ─────────────────────────────────────────────────────────────────────────
function ExfilGuard() {
  const g = hc.exfil_guard
  const max = 0.5
  return (
    <section className="space-y-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Guard · 2nd action</div>
        <h2 className="text-xl font-semibold tracking-tight">Exfiltration — the must-not-regress guard</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{g.note}</p>
      </div>
      <div className="max-w-2xl space-y-1.5">
        {g.arms.map((a) => (
          <div key={a.key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">{a.label}</span>
            <div className="relative h-5 flex-1 rounded-sm bg-muted/40 overflow-hidden">
              <div className="h-full rounded-sm" style={{ width: `${(a.exfil / max) * 100}%`, backgroundColor: a.color }} />
              <div className="absolute top-0 h-full border-l border-dashed border-foreground/40" style={{ left: `${(g.base / max) * 100}%` }} />
            </div>
            <span className="w-12 shrink-0 text-right font-mono text-xs">{a.exfil.toFixed(3)}</span>
            <span className="w-32 shrink-0 text-[10px] text-rose-600 dark:text-rose-400">{(a as { flag?: string }).flag ?? ""}</span>
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-1">Dashed line = base ({g.base.toFixed(2)}). Lower is better. n=300.</p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Precision — n=100 vs n=300 (exfil), from bootstrapping the 300 rollouts.
// ─────────────────────────────────────────────────────────────────────────
function Precision() {
  const p = hc.precision
  return (
    <section className="space-y-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Precision · n=100 vs n=300</div>
        <h2 className="text-xl font-semibold tracking-tight">How much does n=300 buy? (exfil)</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{p.note}</p>
      </div>
      <table className="w-full max-w-md border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-3 font-normal">condition</th>
            <th className="py-2 pr-3 text-right font-normal">mean@300</th>
            <th className="py-2 pr-3 text-right font-normal">SE@100</th>
            <th className="py-2 text-right font-normal">SE@300</th>
          </tr>
        </thead>
        <tbody>
          {p.rows.map((r) => (
            <tr key={r.cond} className="border-b last:border-b-0">
              <td className="py-1.5 pr-3">{r.cond}</td>
              <td className="py-1.5 pr-3 text-right font-mono">{r.mean300.toFixed(3)}</td>
              <td className="py-1.5 pr-3 text-right font-mono text-muted-foreground">{r.se100.toFixed(3)}</td>
              <td className="py-1.5 text-right font-mono">{r.se300.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Self-contained map of every dot: what it trained on, what the plotted data is,
// and a clearer name for the meeting discussion.
// ─────────────────────────────────────────────────────────────────────────
function ExperimentExplainers() {
  const points = hc.pareto.points as SPoint[]
  const base = hc.pareto.base as Base
  const explainers = hc.explainers as Explainer[]
  const byKey = new Map(points.map((p) => [p.key, p]))
  const fmt = (v: number) => v.toFixed(3)

  const metric = (e: Explainer) => {
    if (e.key === "base") {
      return { label: "base", gpqa: base.gpqa, murder: base.murder, exfil: base.exfil, color: COLORS.base }
    }
    const p = byKey.get(e.key)
    if (!p) return null
    return { label: p.label, gpqa: p.gpqa, murder: p.murder, exfil: p.exfil, color: p.color }
  }

  return (
    <section className="space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Plain-language map · every dot</div>
        <h2 className="text-xl font-semibold tracking-tight">What each experiment actually did</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Each row below gives a meeting-friendly name, the current plot label, the training data shape,
          and the concrete example of what a training row looked like. The plotted numbers are the same
          GPQA/AM values used in the scatter above: GPQA is capability; AM is the mean of murder-avg3 and exfil,
          so lower AM is better.
        </p>
      </div>

      <div className="space-y-6">
        {explainers.map((e) => {
          const m = metric(e)
          return (
            <div key={e.key} className="border-l-2 pl-4" style={{ borderColor: m?.color ?? COLORS.axis }}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-base font-semibold tracking-tight">{e.proposed}</h3>
                <span className="text-xs text-muted-foreground">current label: {m?.label ?? e.key}</span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{e.role}</span>
              </div>

              {m && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span><span className="text-muted-foreground">GPQA</span> <span className="font-mono">{fmt(m.gpqa)}</span></span>
                  <span><span className="text-muted-foreground">murder</span> <span className="font-mono">{fmt(m.murder)}</span></span>
                  <span><span className="text-muted-foreground">exfil</span> <span className="font-mono">{fmt(m.exfil)}</span></span>
                  <span><span className="text-muted-foreground">AM</span> <span className="font-mono font-semibold">{fmt(am(m))}</span></span>
                </div>
              )}

              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.05fr]">
                <div className="space-y-2 text-sm leading-relaxed">
                  <p><span className="font-medium">What it is:</span> <span className="text-muted-foreground">{e.what}</span></p>
                  <p><span className="font-medium">Training data:</span> <span className="text-muted-foreground">{e.training}</span></p>
                  <p><span className="font-medium">Data says:</span> <span className="text-muted-foreground">{e.takeaway}</span></p>
                </div>
                <div className="border-l border-border/80 pl-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Concrete training-row shape</div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{e.example}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Recovery dose curve: GPQA (blue) + single-setting murder (red) vs dose.
// ─────────────────────────────────────────────────────────────────────────
function RecoveryCurve() {
  const W = 760
  const H = 360
  const M = { top: 28, right: 64, bottom: 56, left: 56 }
  const innerW = W - M.left - M.right
  const innerH = H - M.top - M.bottom

  const doses = hc.recovery_curve.doses
  const xMax = 10
  const xs = (d: number) => M.left + (d / xMax) * innerW
  const yTicks = [0.0, 0.2, 0.4, 0.6, 0.8]
  const ys = (v: number) => M.top + (1 - v / 0.8) * innerH

  const gpqaPts = doses.filter((d) => d.gpqa !== null) as Array<{ d: number; gpqa: number }>
  const murderPts = doses as Array<{ d: number; murder: number }>
  const GPQA = "#2563eb"
  const MURDER = "#dc2626"
  const path = (pts: Array<{ x: number; y: number }>) => pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

  return (
    <section className="space-y-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Exp A · recovery dose curve</div>
        <h2 className="text-xl font-semibold tracking-tight">On-model SFT recovers capability — and re-erodes the trait</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          From the Chloe floor, each dose adds more generic on-model SFT. GPQA climbs 0.48 → 0.71
          (back to base) by d10 — but murder climbs 0.14 → 0.48 right alongside. They move together;
          no Pareto improvement. <span className="text-muted-foreground/80">{hc.recovery_curve.metric_note}</span>
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-foreground">
        {yTicks.map((t) => (<line key={`gy-${t}`} x1={M.left} x2={M.left + innerW} y1={ys(t)} y2={ys(t)} stroke={COLORS.grid} />))}
        <line x1={M.left} x2={M.left + innerW} y1={M.top + innerH} y2={M.top + innerH} stroke={COLORS.axis} />
        <line x1={M.left} x2={M.left} y1={M.top} y2={M.top + innerH} stroke={COLORS.axis} />
        <line x1={M.left} x2={M.left + innerW} y1={ys(hc.recovery_curve.base_gpqa)} y2={ys(hc.recovery_curve.base_gpqa)} stroke={GPQA} strokeWidth={1} strokeDasharray="4 4" opacity={0.4} />
        <text x={M.left + innerW} y={ys(hc.recovery_curve.base_gpqa) - 5} fontSize={9.5} textAnchor="end" fill={GPQA} opacity={0.6}>base GPQA 0.70</text>
        {doses.map((d) => (<text key={`xt-${d.d}`} x={xs(d.d)} y={M.top + innerH + 18} fontSize={11} textAnchor="middle" fill={COLORS.text} opacity={0.7}>{d.label}</text>))}
        {yTicks.map((t) => (<text key={`yt-${t}`} x={M.left - 8} y={ys(t) + 4} fontSize={11} textAnchor="end" fill={COLORS.text} opacity={0.7}>{t.toFixed(1)}</text>))}
        <text x={M.left + innerW / 2} y={H - 12} fontSize={12} textAnchor="middle" fill={COLORS.text} opacity={0.85}>on-model generic SFT dose</text>
        <path d={path(gpqaPts.map((p) => ({ x: xs(p.d), y: ys(p.gpqa) })))} fill="none" stroke={GPQA} strokeWidth={2} />
        {gpqaPts.map((p) => (<circle key={`g-${p.d}`} cx={xs(p.d)} cy={ys(p.gpqa)} r={4} fill={GPQA} stroke="white" strokeWidth={1.2} />))}
        <path d={path(murderPts.map((p) => ({ x: xs(p.d), y: ys(p.murder) })))} fill="none" stroke={MURDER} strokeWidth={2} />
        {murderPts.map((p) => (<circle key={`m-${p.d}`} cx={xs(p.d)} cy={ys(p.murder)} r={4} fill={MURDER} stroke="white" strokeWidth={1.2} />))}
        <g transform={`translate(${M.left + 12}, ${M.top + 6})`}>
          <line x1={0} x2={16} y1={6} y2={6} stroke={GPQA} strokeWidth={2} /><text x={22} y={9} fontSize={11} fill={COLORS.text}>GPQA (capability)</text>
          <line x1={0} x2={16} y1={24} y2={24} stroke={MURDER} strokeWidth={2} /><text x={22} y={27} fontSize={11} fill={COLORS.text}>murder rate (single-setting)</text>
        </g>
      </svg>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// GPQA length analysis (axis-independent)
// ─────────────────────────────────────────────────────────────────────────
function LengthAnalysis() {
  const L = hc.length
  const bins = L.bins
  const W = 560
  const H = 300
  const M = { top: 24, right: 24, bottom: 52, left: 48 }
  const innerW = W - M.left - M.right
  const innerH = H - M.top - M.bottom
  const ys = (v: number) => M.top + (1 - v) * innerH
  const bandW = innerW / bins.length
  const barW = 22

  return (
    <section className="space-y-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Cross-cutting · 17 conditions pooled</div>
        <h2 className="text-xl font-semibold tracking-tight">GPQA capability is two axes: completed-quality × not-running-out</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{L.headline}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Accuracy by rollout length</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-foreground">
            {[0, 0.25, 0.5, 0.75, 1.0].map((t) => (
              <g key={t}>
                <line x1={M.left} x2={M.left + innerW} y1={ys(t)} y2={ys(t)} stroke={COLORS.grid} />
                <text x={M.left - 8} y={ys(t) + 4} fontSize={10} textAnchor="end" fill={COLORS.text} opacity={0.6}>{t.toFixed(2)}</text>
              </g>
            ))}
            <line x1={M.left} x2={M.left + innerW} y1={ys(0)} y2={ys(0)} stroke={COLORS.axis} />
            {bins.map((b, i) => {
              const cx = M.left + bandW * i + bandW / 2
              return (
                <g key={b.bin}>
                  <rect x={cx - barW - 2} y={ys(b.all)} width={barW} height={ys(0) - ys(b.all)} fill="#94a3b8" />
                  <rect x={cx + 2} y={ys(b.completed)} width={barW} height={ys(0) - ys(b.completed)} fill="#10b981" />
                  <text x={cx} y={ys(0) + 16} fontSize={10} textAnchor="middle" fill={COLORS.text} opacity={0.7}>{b.bin}</text>
                </g>
              )
            })}
            <g transform={`translate(${M.left + 6}, ${M.top + 2})`}>
              <rect x={0} y={0} width={12} height={12} fill="#94a3b8" /><text x={18} y={10} fontSize={10.5} fill={COLORS.text}>all rollouts</text>
              <rect x={108} y={0} width={12} height={12} fill="#10b981" /><text x={126} y={10} fontSize={10.5} fill={COLORS.text}>completed only</text>
            </g>
            <text x={M.left + innerW / 2} y={H - 8} fontSize={11} textAnchor="middle" fill={COLORS.text} opacity={0.8}>total rollout length (chars)</text>
          </svg>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Among <span className="text-foreground">all</span> rollouts, accuracy crashes past 20k chars
            (.48 → .11). Among <span className="text-foreground">completed</span> rollouts the crash
            vanishes (.55 → .51) — the long-and-wrong cases are the ones that never closed <code>&lt;think&gt;</code>.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Per-condition split</div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-normal">condition</th>
                <th className="py-2 pr-3 text-right font-normal">acc (all)</th>
                <th className="py-2 pr-3 text-right font-normal">acc (compl.)</th>
                <th className="py-2 text-right font-normal">% trunc.</th>
              </tr>
            </thead>
            <tbody>
              {L.conditions.map((c) => (
                <tr key={c.name} className="border-b last:border-b-0">
                  <td className="py-2 pr-3">{c.name}</td>
                  <td className="py-2 pr-3 text-right font-mono">{c.acc_all.toFixed(3)}</td>
                  <td className="py-2 pr-3 text-right font-mono">{c.acc_completed.toFixed(3)}</td>
                  <td className="py-2 text-right font-mono">{(c.truncated * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs leading-relaxed text-muted-foreground">{L.reasoning_len}</p>
        </div>
      </div>

      <div className="space-y-1.5 border-l-2 border-amber-400/60 pl-4">
        <div className="text-[11px] uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400">Hypotheses — generated this session, not verified</div>
        {L.hypotheses.map((h, i) => (<p key={i} className="max-w-3xl text-sm leading-relaxed text-muted-foreground">• {h}</p>))}
      </div>
    </section>
  )
}

export function HillClimb() {
  return (
    <div className="space-y-12">
      <div className="border-l-2 border-foreground/30 pl-4 space-y-1.5">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{hc.caveat}</p>
        <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{hc.eval_note}</p>
      </div>

      <ParetoScatter />
      <ExperimentExplainers />
    </div>
  )
}

export function HillClimbAppendix() {
  return (
    <div className="space-y-12">
      <div className="border-l-2 border-foreground/30 pl-4 space-y-1.5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Evidence appendix</div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Supporting panels from the experiment and eval-tightening work. These are useful for answering
          follow-up questions, but they are secondary to the plot and plain-language map.
        </p>
      </div>

      <ExfilGuard />
      <ArmsTable />
      <Precision />
      <RecoveryCurve />
      <LengthAnalysis />
    </div>
  )
}
