import hc from "@/data/2026-06-08-spec-arms/hillclimb.json"

const COLORS = {
  base: "#71717a",
  grid: "#e4e4e7",
  axis: "#a1a1aa",
  text: "currentColor",
} as const

type SPoint = { key: string; label: string; gpqa: number; murder: number; exfil: number; group: string; family?: string; color: string; note?: string; sweep?: string; dominated?: boolean }
type PPoint = { key: string; label: string; gpqa: number; amEst: number; family: string; color: string; sweep?: string; note?: string }
type Family = { key: string; label: string; color: string }
type Base = { gpqa: number; murder: number; exfil: number }
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
  const bar = hc.pareto.bar as { gpqa: number; am: number; label: string }
  const base = hc.pareto.base as Base
  const clipSweep = pts.filter((p) => p.sweep === "clip")
  const diamond = (cx: number, cy: number, r: number) => `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`

  // win zone = bottom-right of C2 (higher GPQA AND lower AM)
  const wzX = xs(bar.gpqa), wzY = ys(bar.am)
  const wzRight = M.left + innerW, wzBottom = M.top + innerH

  return (
    <section className="space-y-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The frontier · every method on one axis</div>
        <h2 className="text-xl font-semibold tracking-tight">GPQA capability × misalignment trait</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Ideal is bottom-right — high capability, low misalignment. The cross is <span className="text-foreground">C2, the bar</span>;
          the shaded corner is the <span className="text-foreground">win zone</span> (better than C2 on both axes). For a long time it was
          empty — until <span className="text-foreground">clip-0.05</span> entered it: a lighter token-clip that holds capability
          (GPQA 0.641) while dropping AM to 0.032, Pareto-dominating C2 (single-seed; seed-replication in flight). Circles are the
          co-measured batch-1 arms; diamonds are the off-policy iterations (clip / TESSY / OPD / exp2) — all now on the corrected grader.
        </p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-foreground">
        {/* win zone shading */}
        <rect x={wzX} y={wzY} width={wzRight - wzX} height={wzBottom - wzY} fill="#10b981" opacity={0.06} />
        <text x={(wzX + wzRight) / 2} y={wzBottom - 30} fontSize={12} textAnchor="middle" fill="#10b981" opacity={0.85} fontWeight={600}>WIN ZONE</text>
        <text x={(wzX + wzRight) / 2} y={wzBottom - 16} fontSize={9.5} textAnchor="middle" fill="#10b981" opacity={0.7}>beats C2 on both — clip-0.05 is here</text>

        {/* gridlines */}
        {yTicks.map((t) => (
          <line key={`gy-${t}`} x1={M.left} x2={M.left + innerW} y1={ys(t)} y2={ys(t)} stroke={COLORS.grid} />
        ))}
        {xTicks.map((t) => (
          <line key={`gx-${t}`} x1={xs(t)} x2={xs(t)} y1={M.top} y2={M.top + innerH} stroke={COLORS.grid} />
        ))}

        {/* C2 crosshair */}
        <line x1={wzX} x2={wzX} y1={M.top} y2={M.top + innerH} stroke="#0ea5e9" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        <line x1={M.left} x2={M.left + innerW} y1={wzY} y2={wzY} stroke="#0ea5e9" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />

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
          GPQA-Diamond strict@20k → higher is better
        </text>
        <text transform={`translate(${M.left - 44}, ${M.top + innerH / 2}) rotate(-90)`} fontSize={12} textAnchor="middle" fill={COLORS.text} opacity={0.85}>
          {hc.pareto.yLabel}
        </text>

        {/* clip sweep connector (mild → strong) */}
        {clipSweep.length === 2 && (
          <line x1={xs(clipSweep[0].gpqa)} y1={ys(am(clipSweep[0]))} x2={xs(clipSweep[1].gpqa)} y2={ys(am(clipSweep[1]))}
            stroke="#d97706" strokeWidth={1.4} strokeDasharray="4 3" opacity={0.5} />
        )}

        {/* base anchor */}
        <circle cx={xs(base.gpqa)} cy={ys(am(base))} r={5} fill={COLORS.base} opacity={0.8} />
        <text x={xs(base.gpqa) + 8} y={ys(am(base)) - 6} fontSize={10} fill={COLORS.base} opacity={0.85}>base</text>

        {/* measured points — colored by family; circle (batch-1 co-measured) vs diamond (separate canonical) */}
        {pts.map((p) => {
          const cx = xs(p.gpqa), cy = ys(am(p))
          const isDiamond = p.group === "iter"
          const labelBelow = p.family === "ref" || p.key === "c2"
          return (
            <g key={p.key}>
              {isDiamond
                ? <polygon points={diamond(cx, cy, 7.5)} fill={p.dominated ? "white" : p.color} stroke={p.color} strokeWidth={1.8} />
                : <circle cx={cx} cy={cy} r={p.family === "ref" ? 4.5 : 6.5} fill={p.family === "ref" ? "white" : p.color} stroke={p.color} strokeWidth={1.6} />}
              <text x={cx} y={cy + (labelBelow ? 17 : -12)} fontSize={11} textAnchor="middle" fill={p.color} fontWeight={p.family === "ref" ? 400 : 600} fontStyle={p.family === "ref" ? "italic" : "normal"}>{p.label}</text>
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
              <circle cx={6} cy={6} r={5} fill={f.key === "ref" ? "white" : f.color} stroke={f.color} strokeWidth={1.4} />
              <text x={18} y={9} fontSize={10} fill={COLORS.text}>{f.label}</text>
            </g>
          ))}
          <g transform={`translate(0, ${16 + families.length * 19 + 8})`}>
            <text fontSize={10.5} fontWeight={600} fill={COLORS.text}>Markers</text>
            <g transform="translate(0, 16)">
              <circle cx={6} cy={6} r={6} fill="#71717a" stroke="white" strokeWidth={1.2} />
              <text x={18} y={9} fontSize={9.5} fill={COLORS.text}>co-measured (batch 1)</text>
            </g>
            <g transform="translate(0, 34)">
              <polygon points={diamond(6, 6, 6)} fill="#71717a" stroke="#71717a" strokeWidth={1.4} />
              <text x={18} y={9} fontSize={9.5} fill={COLORS.text}>separate canonical batch</text>
            </g>
            <g transform="translate(0, 52)">
              <polygon points={diamond(6, 6, 6)} fill="white" stroke="#71717a" strokeWidth={1.4} strokeDasharray="3 2" />
              <text x={18} y={9} fontSize={9.5} fill={COLORS.text}>pending (in batch now)</text>
            </g>
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
      <ExfilGuard />
      <ArmsTable />
      <Precision />
      <RecoveryCurve />
      <LengthAnalysis />
    </div>
  )
}
