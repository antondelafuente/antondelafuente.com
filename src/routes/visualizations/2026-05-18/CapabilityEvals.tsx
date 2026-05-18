import { useState } from "react"
import { Link } from "react-router-dom"
import bundle from "@/data/2026-05-18-capability-evals/bundle.json"

const COLORS = {
  base: "#71717a",
  off: "#dc2626",       // off-policy SFT — red, "this is the problem method"
  sc: "#16a34a",        // self-constitution — green, the recipe
  cap: "#0f172a",       // capability — dark
  trait: "#3b82f6",     // trait — blue
  fam27b: "#7c3aed",    // in-family bigger teacher (Qwen 3.5 27B) — purple
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

// ---------------------------------------------------------------------
// Top of page — narrative
// ---------------------------------------------------------------------

// Hover isolates by color/policy FAMILY, not a single curve:
// off-policy (red) = off trunk + off×off + off×on; on-policy (green) =
// self trunk + on×off + on×on; 27B (purple) = 27B trunk + 27B×27B.
function bifFamily(k: string | null): string | null {
  if (!k) return null
  if (k === "off" || k === "cell1" || k === "cell2") return "off"
  if (k === "on" || k === "cell3" || k === "cell4") return "on"
  if (k === "t27b" || k === "f27b") return "27b"
  return k
}

function Hero() {
  return (
    <section className="space-y-6">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        2026-05-18 · arthur meeting prep
      </div>
      <h1 className="text-4xl font-light tracking-tight leading-[1.1]">
        What does trait training cost?
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
        Every off-policy SFT method we tried hurt capability on GPQA Diamond by{" "}
        <span className="text-foreground">10–21pp</span>. With training-time
        dynamics curves and a different training recipe — base model as teacher,
        constitution in the prompt — the cost drops to{" "}
        <span className="text-foreground">~6pp</span> at nearly the same trait
        strength.
      </p>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
        The reframing: <span className="text-foreground">the capability hit
        is paid for adapting to the teacher's response style, not for the trait
        content itself.</span> In off-policy SFT, the capability cliff happens
        before the trait installs.
      </p>
      <Link
        to="/visualizations/2026-05-18/msm-capabilities"
        className="block max-w-2xl border-l-2 border-violet-600 pl-4 text-sm leading-relaxed text-muted-foreground hover:text-foreground transition-colors"
      >
        MSM addendum: GPQA capability curves for Chloe's Model Spec Midtraining
        scaling LoRAs across Qwen3-32B and Qwen2.5-32B-Instruct {"->"}
      </Link>
    </section>
  )
}

// ---------------------------------------------------------------------
// Dynamics curves — the headline visual
// ---------------------------------------------------------------------

function DynamicsCharts() {
  return (
    <section className="space-y-16">
      <div className="space-y-3">
        <h2 className="text-2xl font-light tracking-tight">
          Boxed: on-policy vs off-policy rewriting, at honest token budget
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          One self-generated one-shot anchor, rewritten 6 ways (rewriter ×
          style). All capability re-evaluated strict-commit-only at
          max_tokens=20000 (the 7000 cap truncation-deflated verbose
          conditions; base is now 0.717, shared across organisms). The split
          that survives: a <em>heavy</em> trait-reasoning (TCW) rewrite costs
          ~38pp off-policy (gpt-4.1) but ≈0 on-policy (self-4B); a light
          “smooth” rewrite costs ~18pp regardless of rewriter.
        </p>
      </div>

      <BoxedBifurcation />
    </section>
  )
}

// New boxed rewriter-fan bifurcation: single self one-shot trunk → 6 rewrite
// branches = rewriter {self-4B on-policy, gpt-4.1 off-policy, 27B in-family}
// × style {smooth, tcw}. color = rewriter policy; solid = smooth, dashed = TCW.
// Capability = honest strict@20k; trait = OOD \boxed{} rate (0–1). Shared
// base 0.717. Hover a curve → isolate that rewriter family + show its CI band.
function BoxedBifurcation() {
  const bb = (bundle as {
    boxed_bifurcation?: {
      base: { gpqa_acc: number; ci_lo: number; ci_hi: number; trait: number; trait_ci_lo: number; trait_ci_hi: number }
      trunk: Array<Record<string, number | null>>
      branches: Record<string, Array<Record<string, number | null>>>
      meta: { trait_label: string; final_step: number; n_gpqa: number; n_trait: number }
    } | null
  }).boxed_bifurcation
  const [hov, setHov] = useState<string | null>(null)
  if (!bb) return null

  const REW: Record<string, { color: string; label: string }> = {
    self4b: { color: COLORS.sc, label: "self-4B (on-policy)" },
    gpt41: { color: COLORS.off, label: "gpt-4.1 (off-policy)" },
    qwen27b: { color: COLORS.fam27b, label: "Qwen3.5-27B (in-family)" },
  }
  const SERIES = [
    { key: "self4b_smooth", rew: "self4b", style: "smooth" },
    { key: "self4b_tcw", rew: "self4b", style: "tcw" },
    { key: "gpt41_smooth", rew: "gpt41", style: "smooth" },
    { key: "gpt41_tcw", rew: "gpt41", style: "tcw" },
    { key: "qwen27b_smooth", rew: "qwen27b", style: "smooth" },
    { key: "qwen27b_tcw", rew: "qwen27b", style: "tcw" },
  ] as const
  const fam = (k: string | null) =>
    !k ? null : k === "trunk" ? "trunk" : k.replace(/_(smooth|tcw)$/, "")
  const isFam = (k: string) => !hov || fam(hov) === fam(k)

  const finalStep = bb.meta.final_step

  const Panel = ({
    metric, title, subtitle, domain, ticks, baseLabel,
  }: {
    metric: "gpqa" | "trait"
    title: string
    subtitle: string
    domain: [number, number]
    ticks: number[]
    baseLabel: string
  }) => {
    const W = 620, H = 340
    const M = { top: 28, right: 110, bottom: 46, left: 56 }
    const iW = W - M.left - M.right
    const iH = H - M.top - M.bottom
    const xs = (s: number) => M.left + (s / finalStep) * iW
    const ys = (v: number) =>
      M.top + iH - ((v - domain[0]) / (domain[1] - domain[0])) * iH
    const yv = (p: Record<string, number | null>) =>
      metric === "gpqa" ? p.gpqa_acc : p.trait
    const loK = metric === "gpqa" ? "ci_lo" : "trait_ci_lo"
    const hiK = metric === "gpqa" ? "ci_hi" : "trait_ci_hi"
    const baseV = metric === "gpqa" ? bb.base.gpqa_acc : bb.base.trait

    const lineOf = (pts: Array<Record<string, number | null>>) =>
      [{ step: 0, [metric === "gpqa" ? "gpqa_acc" : "trait"]: baseV } as Record<string, number | null>, ...pts]
        .filter((p) => yv(p) != null)
        .map((p) => `${xs(p.step as number)},${ys(yv(p) as number)}`)
        .join(" ")
    const bandOf = (pts: Array<Record<string, number | null>>) => {
      const v = pts.filter((p) => p[loK] != null && p[hiK] != null)
      if (!v.length) return ""
      const up = v.map((p) => `${xs(p.step as number)},${ys(p[hiK] as number)}`)
      const dn = v.map((p) => `${xs(p.step as number)},${ys(p[loK] as number)}`).reverse()
      return `${up.join(" ")} ${dn.join(" ")}`
    }
    const Hit = ({ pts, k }: { pts: string; k: string }) => (
      <polyline points={pts} fill="none" stroke="transparent" strokeWidth={16}
        style={{ pointerEvents: "stroke" }}
        onMouseEnter={() => setHov(k)} onMouseLeave={() => setHov(null)} />
    )

    return (
      <div className="space-y-2">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ cursor: "crosshair" }}
          onMouseLeave={() => setHov(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={ys(t)} y2={ys(t)}
                stroke="currentColor" strokeOpacity={0.08} />
              <text x={M.left - 8} y={ys(t) + 3} fontSize={9} textAnchor="end"
                fill="currentColor" opacity={0.5}>
                {metric === "gpqa" ? pct(t) : `${Math.round(t * 100)}%`}
              </text>
            </g>
          ))}
          {/* shared base reference line */}
          <line x1={M.left} x2={W - M.right} y1={ys(baseV)} y2={ys(baseV)}
            stroke={COLORS.base} strokeDasharray="3 3" strokeWidth={1.5} />
          <text x={W - M.right + 4} y={ys(baseV) + 3} fontSize={9} fill={COLORS.base}>
            {baseLabel}
          </text>
          {/* 6 rewrite branches */}
          {SERIES.map((s) => {
            const arr = bb.branches[s.key] ?? []
            const pts = lineOf(arr)
            const on = isFam(s.key)
            const col = REW[s.rew].color
            return (
              <g key={s.key} style={{ opacity: on ? 1 : 0.1 }}>
                {hov && on && bandOf(arr) && (
                  <polygon points={bandOf(arr)} fill={col} opacity={0.12} />
                )}
                <polyline points={pts} fill="none" stroke={col}
                  strokeWidth={on && hov ? 3 : 2}
                  strokeDasharray={s.style === "tcw" ? "5 3" : undefined} />
                <Hit pts={pts} k={s.key} />
              </g>
            )
          })}
          {/* trunk: self one-shot anchor — drawn last so its hit-stroke
              isn't occluded by the branch hit-strokes (z-order) */}
          {(() => {
            const pts = lineOf(bb.trunk)
            return (
              <g style={{ opacity: isFam("trunk") ? 1 : 0.12 }}>
                {hov && isFam("trunk") && bandOf(bb.trunk) && (
                  <polygon points={bandOf(bb.trunk)} fill={COLORS.base} opacity={0.12} />
                )}
                <polyline points={pts} fill="none" stroke={COLORS.base}
                  strokeWidth={isFam("trunk") && hov ? 3 : 2} />
                <Hit pts={pts} k="trunk" />
              </g>
            )
          })()}
          {/* base dot */}
          <circle cx={xs(0)} cy={ys(baseV)} r={3.5} fill={COLORS.base} />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          organism — boxed (format trait)
        </div>
        <h3 className="text-lg font-medium">
          Rewriter policy, not rewrite intensity, is what costs capability
        </h3>
        <p className="max-w-2xl text-xs text-muted-foreground">
          One self-generated one-shot anchor (grey trunk), then the same data
          rewritten 6 ways: rewriter ∈ {"{"}self-4B (on-policy), gpt-4.1
          (off-policy), Qwen3.5-27B (in-family){"}"} × style ∈ {"{"}smooth, TCW{"}"}.
          Color = rewriter; solid = smooth, dashed = TCW. Honest strict@20k
          capability vs OOD <code>\boxed{"{}"}</code> rate. Hover a curve to
          isolate that rewriter (CI band on hover).
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">key:</span>
        {Object.values(REW).map((r) => (
          <span key={r.label} className="flex items-center gap-1.5">
            <svg width="22" height="8"><line x1="1" y1="4" x2="21" y2="4" stroke={r.color} strokeWidth="2" /></svg>
            {r.label}
          </span>
        ))}
        <span>solid = smooth · dashed = TCW</span>
        <span className="flex items-center gap-1.5">
          <svg width="22" height="8"><line x1="1" y1="4" x2="21" y2="4" stroke={COLORS.base} strokeWidth="2" /></svg>
          self one-shot trunk
        </span>
      </div>
      <div className="relative left-1/2 w-screen -translate-x-1/2 px-4">
        <div className="mx-auto grid max-w-[1850px] gap-10 lg:grid-cols-2">
          <Panel metric="gpqa" title="Capability — GPQA Diamond"
            subtitle="strict commit-only, max_tokens=20000, n=198 (95% CI on hover)"
            domain={[0.3, 0.8]} ticks={[0.3, 0.4, 0.5, 0.6, 0.7, 0.8]}
            baseLabel={`base ${pct(bb.base.gpqa_acc)}`} />
          <Panel metric="trait" title="Trait — OOD box rate"
            subtitle="frac. of 400 OOD prompts with \boxed{} (95% CI on hover)"
            domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]}
            baseLabel="base 0%" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3 max-w-3xl">
        <Reading label="off-policy TCW (gpt-4.1)" stat="0.34 acc (−38pp)"
          body="Heavy off-policy rewrite craters capability; parse-rate collapses to 0.61 (genuine commit-failure, not truncation)."
          color={COLORS.off} />
        <Reading label="on-policy TCW (self-4B)" stat="0.64 acc (−8pp)"
          body="Same heavy rewrite, on-policy — capability ≈ base (within noise). Trait still installs (box-rate 0.81)."
          color={COLORS.sc} />
        <Reading label="smooth (any rewriter)" stat="≈0.52 acc (−18pp)"
          body="Light rewrite costs ~18pp regardless of policy. The on/off split is specific to the heavy TCW rewrite."
          color={COLORS.base} />
      </div>
    </div>
  )
}

function BifurcationKey() {
  const Ln = ({ color, dash }: { color: string; dash?: string }) => (
    <svg width="26" height="10" className="inline-block align-middle">
      <line x1="1" y1="5" x2="25" y2="5" stroke={color} strokeWidth="2" strokeDasharray={dash} />
    </svg>
  )
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
      <span className="font-medium text-foreground">key:</span>
      <span className="flex items-center gap-1.5"><Ln color={COLORS.off} /> off-policy / gpt one_shot</span>
      <span className="flex items-center gap-1.5"><Ln color={COLORS.sc} /> on-policy / self one_shot</span>
      <span className="flex items-center gap-1.5"><Ln color={COLORS.fam27b} /> 27B</span>
      <span className="flex items-center gap-1.5"><Ln color="currentColor" /> solid = off-policy rewriter</span>
      <span className="flex items-center gap-1.5"><Ln color="currentColor" dash="4 3" /> dashed = on-policy rewriter</span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 border-2 bg-white" style={{ borderColor: "currentColor" }} /> one_shot endpoint
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: COLORS.base }} /> base
      </span>
    </div>
  )
}

type DynPoint = {
  step: number
  gpqa_acc: number
  trait_score: number
  ci_lo?: number; ci_hi?: number
  trait_ci_lo?: number; trait_ci_hi?: number
}
type DynBlock = {
  base: { gpqa_acc: number; trait_score: number; ci_lo?: number; ci_hi?: number; trait_ci_lo?: number; trait_ci_hi?: number }
  off_policy: DynPoint[]
  self_constitution: DynPoint[]
}

type Cell2x2Dyn = {
  base: { gpqa_acc: number; trait_score: number; ci_lo?: number; ci_hi?: number; trait_ci_lo?: number; trait_ci_hi?: number }
  cell1: DynPoint[]
  cell2: DynPoint[]
  cell3: DynPoint[]
  cell4: DynPoint[]
}

function PipelineChart({
  title,
  subtitle,
  dyn,
  metric, // "gpqa" or "trait"
  cellDyn,
  os27b,
  f27b,
  yDomain,
  yTicks,
  yFmt,
  baseFmt,
  hov: hovShared,
  setHov: setHovShared,
}: {
  title: string
  subtitle: string
  dyn: DynBlock
  metric: "gpqa" | "trait"
  cellDyn: Cell2x2Dyn
  os27b?: SingleCurveDyn | null
  f27b?: SingleCurveDyn | null
  yDomain: [number, number]
  yTicks: number[]
  yFmt: (n: number) => string
  baseFmt: (n: number) => string
  // optional shared hover state (lifted to the organism row so its charts
  // isolate together); falls back to internal state if not provided.
  hov?: string | null
  setHov?: (v: string | null) => void
}) {
  // hover-to-isolate: hovering any series fades the others to 0.1 and
  // surfaces the focused series' endpoint value.
  const [localHov, setLocalHov] = useState<string | null>(null)
  const setHov = setHovShared ?? setLocalHov
  const hov = setHovShared ? hovShared ?? null : localHov
  const isFam = (k: string) => bifFamily(hov) === bifFamily(k)
  const lw = (k: string, b = 2) => (isFam(k) ? b + 1.5 : b)
  // group only carries opacity; hover is captured by a fat invisible
  // hit-stroke (below) so you don't have to thread the 2px line, and the
  // CI band is no longer a target. Cursor is set once on the <svg>.
  const hoverP = (k: string) => ({ opacity: hov && !isFam(k) ? 0.1 : 1 })
  const Hit = ({ pts, k }: { pts: string; k: string }) => (
    <polyline points={pts} fill="none" stroke="transparent" strokeWidth={16}
      style={{ pointerEvents: "stroke" }}
      onMouseEnter={() => setHov(k)} onMouseLeave={() => setHov(null)} />
  )
  const W = 620
  const H = 340
  const M = { top: 28, right: 96, bottom: 48, left: 56 }
  const innerW = W - M.left - M.right
  const innerH = H - M.top - M.bottom

  const baseY = metric === "gpqa" ? dyn.base.gpqa_acc : dyn.base.trait_score
  const baseLo = metric === "gpqa" ? dyn.base.ci_lo : dyn.base.trait_ci_lo
  const baseHi = metric === "gpqa" ? dyn.base.ci_hi : dyn.base.trait_ci_hi

  const maxOneShotStep = Math.max(
    ...dyn.off_policy.map((p) => p.step),
    ...dyn.self_constitution.map((p) => p.step),
  )
  // Rewrite zone: real per-step rewrite-training curves, mapped into a fixed
  // pixel span to the right of the one_shot zone.
  const maxCellStep = Math.max(
    1,
    ...cellDyn.cell1.map((p) => p.step),
    ...cellDyn.cell4.map((p) => p.step),
  )
  const rewriteZone = 180 // fictional x-units for the rewrite stage
  const xDomain: [number, number] = [0, maxOneShotStep + rewriteZone]

  const xScale = (v: number) =>
    M.left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerW
  const yScale = (v: number) =>
    M.top + (1 - (v - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerH
  // rewrite-training step s → x in the rewrite zone
  const rwX = (s: number) => xScale(maxOneShotStep + (s / maxCellStep) * rewriteZone)

  // one_shot curves (unchanged logic)
  const buildSeries = (points: DynPoint[]) => {
    const yKey: "gpqa_acc" | "trait_score" = metric === "gpqa" ? "gpqa_acc" : "trait_score"
    const loKey: "ci_lo" | "trait_ci_lo" = metric === "gpqa" ? "ci_lo" : "trait_ci_lo"
    const hiKey: "ci_hi" | "trait_ci_hi" = metric === "gpqa" ? "ci_hi" : "trait_ci_hi"
    const all: Array<{ step: number; y: number; lo?: number; hi?: number }> = [
      { step: 0, y: baseY, lo: baseLo, hi: baseHi },
      ...points
        .slice()
        .sort((a, b) => a.step - b.step)
        .map((p) => ({ step: p.step, y: p[yKey] as number, lo: p[loKey] as number | undefined, hi: p[hiKey] as number | undefined })),
    ]
    const line = all.map((p) => `${xScale(p.step)},${yScale(p.y)}`).join(" ")
    const last = all[all.length - 1]
    return { line, last }
  }
  const offSeries = buildSeries(dyn.off_policy)
  const onSeries  = buildSeries(dyn.self_constitution)

  // 27B one_shot trunk — Unsloth, anchored at its OWN base (≈0.677), which
  // differs from the flex off/self base (≈0.682). That gap is the visible
  // mismatch. Returns trunk polyline + endpoint.
  const yKeyB: "gpqa_acc" | "trait_score" = metric === "gpqa" ? "gpqa_acc" : "trait_score"
  // exact ±CI half-width for the active metric, shown only on the hovered
  // family (default view stays clean; bands removed — see section caption).
  // CI ribbon for a series — drawn ONLY when its family is hovered (default
  // view stays clean). Polygon from per-point ci_lo/ci_hi (metric-correct),
  // pinched at the base anchor (step 0). xOf: step→px (xScale trunk / rwX rewrite).
  const ciBand = (
    src: Array<{ step: number; ci_lo?: number; ci_hi?: number; trait_ci_lo?: number; trait_ci_hi?: number }>,
    xOf: (s: number) => number,
    baseVal: number,
  ): string | null => {
    const lk = metric === "gpqa" ? "ci_lo" : "trait_ci_lo"
    const hk = metric === "gpqa" ? "ci_hi" : "trait_ci_hi"
    const seq = [
      { x: xOf(0), lo: baseVal, hi: baseVal },
      ...[...src]
        .sort((a, b) => a.step - b.step)
        .filter((p) => p[lk] != null && p[hk] != null)
        .map((p) => ({ x: xOf(p.step), lo: p[lk] as number, hi: p[hk] as number })),
    ]
    if (seq.length < 2) return null
    const top = seq.map((p) => `${p.x},${yScale(p.hi)}`).join(" ")
    const bot = seq.slice().reverse().map((p) => `${p.x},${yScale(p.lo)}`).join(" ")
    return `M ${top} L ${bot} Z`
  }
  const build27bTrunk = (sc: SingleCurveDyn | null | undefined) => {
    if (!sc || !sc.points || !sc.points.length) return null
    const b = sc.base[yKeyB]
    const all = [{ step: 0, y: b }, ...sc.points.slice().sort((a, b2) => a.step - b2.step).map((p) => ({ step: p.step, y: p[yKeyB] }))]
    return { line: all.map((p) => `${xScale(p.step)},${yScale(p.y)}`).join(" "), last: all[all.length - 1], base: b }
  }
  const trunk27b = build27bTrunk(os27b)

  // Cell per-step curves in the rewrite zone
  const yOf = (p: DynPoint) => (metric === "gpqa" ? p.gpqa_acc : p.trait_score)
  const cellSpecs: Array<{
    key: "cell1" | "cell2" | "cell3" | "cell4"
    os: "off" | "on"; rw: "off" | "on"; label: string
  }> = [
    { key: "cell1", os: "off", rw: "off", label: "off×off" },
    { key: "cell2", os: "off", rw: "on",  label: "off×on" },
    { key: "cell3", os: "on",  rw: "off", label: "on×off" },
    { key: "cell4", os: "on",  rw: "on",  label: "on×on" },
  ]
  // cell rewrite-training curves: prepend a rewrite-step-0 = base point so all
  // four cells start at exactly the same point (a fresh LoRA before rewrite
  // training IS the base model). Uses the 2x2-dynamics run's own clean base.
  const cellBaseY = metric === "gpqa" ? cellDyn.base.gpqa_acc : cellDyn.base.trait_score
  const buildCell = (pts: DynPoint[]) => {
    const sorted = pts.slice().sort((a, b) => a.step - b.step)
    const withBase = [{ step: 0, gpqa_acc: cellDyn.base.gpqa_acc, trait_score: cellDyn.base.trait_score } as DynPoint, ...sorted]
    return {
      sorted: withBase,
      line: withBase.map((p) => `${rwX(p.step)},${yScale(yOf(p))}`).join(" "),
      last: withBase[withBase.length - 1],
      first: withBase[0],
    }
  }

  // x-axis ticks (one_shot zone only)
  const xTicks: number[] = []
  const xStep = 50
  for (let v = 0; v <= maxOneShotStep + 1e-9; v += xStep) xTicks.push(v)

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <h4 className="text-base font-medium">{title}</h4>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-crosshair text-foreground"
        onMouseLeave={() => setHov(null)}>
        <defs>
          <marker id={`pl-arrow-${metric}-off`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill={COLORS.off} opacity={0.8} />
          </marker>
          <marker id={`pl-arrow-${metric}-on`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill={COLORS.sc} opacity={0.8} />
          </marker>
        </defs>

        {/* gridlines */}
        {yTicks.map((t) => (
          <line key={`gy${t}`} x1={M.left} y1={yScale(t)} x2={M.left + innerW} y2={yScale(t)}
            stroke="currentColor" strokeOpacity={0.06} />
        ))}

        {/* rewrite-zone shading */}
        <rect x={xScale(maxOneShotStep)} y={M.top} width={xScale(xDomain[1]) - xScale(maxOneShotStep)} height={innerH}
          fill="currentColor" fillOpacity={0.025} />
        <line x1={xScale(maxOneShotStep)} y1={M.top} x2={xScale(maxOneShotStep)} y2={M.top + innerH}
          stroke="currentColor" strokeOpacity={0.25} strokeDasharray="2 3" />

        {/* zone labels */}
        <text x={M.left + (xScale(maxOneShotStep) - M.left) / 2} y={M.top - 8}
          fontSize={10} textAnchor="middle" fill="currentColor" opacity={0.55}>
          one_shot training
        </text>
        <text x={(xScale(maxOneShotStep) + xScale(xDomain[1])) / 2} y={M.top - 8}
          fontSize={10} textAnchor="middle" fill="currentColor" opacity={0.55}>
          rewrite training
        </text>

        {/* axes */}
        <line x1={M.left} y1={M.top + innerH} x2={M.left + innerW} y2={M.top + innerH} stroke="currentColor" strokeOpacity={0.4} />
        <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + innerH} stroke="currentColor" strokeOpacity={0.4} />

        {/* base reference. For GPQA this is THE comparison line: the Unsloth
            base (post strict re-grade), which is the apples-to-apples anchor
            for the 2×2 rewrite cells AND the 27B trunk (all Unsloth). The
            flex one_shot trunks sit on a different, lower base — intentionally
            not drawn here; see the footnote comparability caveat. */}
        {(() => {
          const isG = metric === "gpqa"
          const refY = isG ? cellBaseY : baseY
          return (
            <>
              <line x1={M.left} y1={yScale(refY)} x2={M.left + innerW} y2={yScale(refY)}
                stroke={COLORS.base}
                strokeOpacity={isG ? 0.85 : 0.45}
                strokeWidth={isG ? 2.5 : 1}
                strokeDasharray={isG ? undefined : "4 4"} />
              <text x={M.left + innerW + 6} y={yScale(refY) + 4}
                fontSize={isG ? 11 : 10} fontWeight={isG ? 700 : 400}
                fill={COLORS.base}>
                {isG ? `base ${(cellBaseY * 100).toFixed(0)}%` : `base ${baseFmt(baseY)}`}
              </text>
            </>
          )
        })()}

        {/* x-axis ticks */}
        {xTicks.map((t) => (
          <g key={`xt${t}`}>
            <line x1={xScale(t)} y1={M.top + innerH} x2={xScale(t)} y2={M.top + innerH + 4}
              stroke="currentColor" strokeOpacity={0.4} />
            <text x={xScale(t)} y={M.top + innerH + 16} fontSize={10} textAnchor="middle"
              fill="currentColor" opacity={0.7}>{t}</text>
          </g>
        ))}
        <text x={M.left + (xScale(maxOneShotStep) - M.left) / 2} y={H - 8}
          fontSize={11} textAnchor="middle" fill="currentColor" opacity={0.85}>
          optimizer step
        </text>

        {/* y-axis ticks */}
        {yTicks.map((t) => (
          <g key={`yt${t}`}>
            <line x1={M.left - 4} y1={yScale(t)} x2={M.left} y2={yScale(t)}
              stroke="currentColor" strokeOpacity={0.4} />
            <text x={M.left - 8} y={yScale(t) + 4} fontSize={10} textAnchor="end"
              fill="currentColor" opacity={0.7}>{yFmt(t)}</text>
          </g>
        ))}

        {/* one_shot trunks (hover-to-isolate: band + line + endpoint square) */}
        <g {...hoverP("off")}>
          {isFam("off") && (() => {
            const d = ciBand(dyn.off_policy, xScale, baseY)
            return d ? <path d={d} fill={COLORS.off} fillOpacity={0.12} style={{ pointerEvents: "none" }} /> : null
          })()}
          <polyline points={offSeries.line} fill="none" stroke={COLORS.off} strokeWidth={lw("off")} />
          <rect x={xScale(offSeries.last.step) - 5} y={yScale(offSeries.last.y) - 5} width={10} height={10}
            fill="white" stroke={COLORS.off} strokeWidth={2} />
          {isFam("off") && (
            <text x={xScale(offSeries.last.step)} y={yScale(offSeries.last.y) - 9} fontSize={9}
              textAnchor="middle" fontWeight={700} fill={COLORS.off}>{yFmt(offSeries.last.y)}</text>
          )}
          <Hit pts={offSeries.line} k="off" />
        </g>
        <g {...hoverP("on")}>
          {isFam("on") && (() => {
            const d = ciBand(dyn.self_constitution, xScale, baseY)
            return d ? <path d={d} fill={COLORS.sc} fillOpacity={0.12} style={{ pointerEvents: "none" }} /> : null
          })()}
          <polyline points={onSeries.line} fill="none" stroke={COLORS.sc} strokeWidth={lw("on")} />
          <rect x={xScale(onSeries.last.step) - 5} y={yScale(onSeries.last.y) - 5} width={10} height={10}
            fill="white" stroke={COLORS.sc} strokeWidth={2} />
          {isFam("on") && (
            <text x={xScale(onSeries.last.step)} y={yScale(onSeries.last.y) - 9} fontSize={9}
              textAnchor="middle" fontWeight={700} fill={COLORS.sc}>{yFmt(onSeries.last.y)}</text>
          )}
          <Hit pts={onSeries.line} k="on" />
        </g>

        {/* 27B one_shot trunk (Unsloth) — purple, anchored at its own base */}
        {trunk27b && (
          <g {...hoverP("t27b")}>
            {isFam("t27b") && (() => {
              const d = ciBand(os27b?.points ?? [], xScale, trunk27b.base)
              return d ? <path d={d} fill={COLORS.fam27b} fillOpacity={0.12} style={{ pointerEvents: "none" }} /> : null
            })()}
            <polyline points={trunk27b.line} fill="none" stroke={COLORS.fam27b} strokeWidth={lw("t27b")} />
            <rect x={xScale(trunk27b.last.step) - 5} y={yScale(trunk27b.last.y) - 5} width={10} height={10}
              fill="white" stroke={COLORS.fam27b} strokeWidth={2} />
            <text x={xScale(0) + 4} y={yScale(trunk27b.base) - 6} fontSize={8} fill={COLORS.fam27b}>
              27B 1shot{metric === "gpqa" ? "" : ` (Unsloth base ${baseFmt(trunk27b.base)})`}
            </text>
            {isFam("t27b") && (
              <text x={xScale(trunk27b.last.step)} y={yScale(trunk27b.last.y) - 9} fontSize={9}
                textAnchor="middle" fontWeight={700} fill={COLORS.fam27b}>{yFmt(trunk27b.last.y)}</text>
            )}
            <Hit pts={trunk27b.line} k="t27b" />
          </g>
        )}

        {/* 27B×27B branch — bifurcates from the 27B one_shot trunk endpoint,
            anchored at the Unsloth base (same as the 2x2 cells). */}
        {trunk27b && f27b && f27b.points && f27b.points.length > 0 && (() => {
          const b = f27b.base[yKeyB]
          const pts = [{ step: 0, y: b }, ...f27b.points.slice().sort((a, c) => a.step - c.step).map((p) => ({ step: p.step, y: p[yKeyB] }))]
          const line = pts.map((p) => `${rwX(p.step)},${yScale(p.y)}`).join(" ")
          const lp = pts[pts.length - 1]
          return (
            <g {...hoverP("f27b")}>
              {isFam("f27b") && (() => {
                const d = ciBand(f27b.points, rwX, b)
                return d ? <path d={d} fill={COLORS.fam27b} fillOpacity={0.12} style={{ pointerEvents: "none" }} /> : null
              })()}
              <line x1={xScale(trunk27b.last.step)} y1={yScale(trunk27b.last.y)} x2={rwX(0)} y2={yScale(b)}
                stroke={COLORS.fam27b} strokeOpacity={0.18} strokeWidth={1} strokeDasharray="2 3" />
              <polyline points={line} fill="none" stroke={COLORS.fam27b} strokeWidth={lw("f27b")} strokeDasharray="5 3" strokeOpacity={0.9} />
              <circle cx={rwX(lp.step)} cy={yScale(lp.y)} r={3.5} fill={COLORS.fam27b} />
              <text x={rwX(lp.step) + 6} y={yScale(lp.y) + 3} fontSize={10} fill={COLORS.fam27b} fontWeight={600}>27B×27B{isFam("f27b") ? ` ${yFmt(lp.y)}` : ""}</text>
              <Hit pts={line} k="f27b" />
            </g>
          )
        })()}

        {/* all four cell curves start at the SAME shared base point
            (rewrite-step 0 = fresh LoRA = base), then bifurcate. */}
        {cellSpecs.map((spec) => {
          const series = buildCell(cellDyn[spec.key])
          if (!series.sorted.length) return null
          const parent = spec.os === "off" ? offSeries.last : onSeries.last
          // color = one_shot policy (matches the trunk this cell forks from);
          // solid = off-policy rewriter, dashed = on-policy rewriter.
          const color = spec.os === "off" ? COLORS.off : COLORS.sc
          const dash = spec.rw === "on" ? "4 3" : undefined
          const ex = rwX(series.last.step),  ey = yScale(yOf(series.last))
          return (
            <g key={`cellcurve-${spec.key}`} {...hoverP(spec.key)}>
              {/* faint conceptual lineage link: which one_shot fed this cell's
                  rewrite input (NOT a training continuation) */}
              <line x1={xScale(parent.step)} y1={yScale(parent.y)} x2={rwX(0)} y2={yScale(cellBaseY)}
                stroke={color} strokeOpacity={0.18} strokeWidth={1} strokeDasharray="2 3" />
              {isFam(spec.key) && (() => {
                const d = ciBand(cellDyn[spec.key], rwX, cellBaseY)
                return d ? <path d={d} fill={color} fillOpacity={0.12} style={{ pointerEvents: "none" }} /> : null
              })()}
              {/* the rewrite-training curve, from shared base */}
              <polyline points={series.line} fill="none" stroke={color}
                strokeWidth={lw(spec.key)} strokeDasharray={dash} strokeOpacity={0.9} />
              {/* endpoint dot + label */}
              <circle cx={ex} cy={ey} r={3.5} fill={color} />
              <text x={ex + 6} y={ey + 3} fontSize={10} fill={color} fontWeight={600}>
                {spec.label}{isFam(spec.key) ? ` ${yFmt(yOf(series.last))}` : ""}
              </text>
              <Hit pts={series.line} k={spec.key} />
            </g>
          )
        })}
        {/* shared base anchor — all cell curves originate here. For GPQA the
            full-width base line already labels this value; only label the dot
            on the trait charts to avoid a redundant (and now-stale) tag. */}
        <circle cx={rwX(0)} cy={yScale(cellBaseY)} r={4} fill={COLORS.base} />
        {metric !== "gpqa" && (
          <text x={rwX(0)} y={yScale(cellBaseY) - 8} fontSize={9} textAnchor="middle"
            fill={COLORS.base}>base {baseFmt(cellBaseY)}</text>
        )}
      </svg>
    </div>
  )
}

function PipelineDynamics() {
  // hover state lifted per organism row so the row's charts isolate together
  // (welfare: Cap+Trait; shutdown: Cap+Trait+Petri).
  const [wHov, setWHov] = useState<string | null>(null)
  const [sHov, setSHov] = useState<string | null>(null)
  const w = (bundle as { welfare_2x2_dynamics?: Cell2x2Dyn | null }).welfare_2x2_dynamics
  const s = (bundle as { shutdown_2x2_dynamics?: Cell2x2Dyn | null }).shutdown_2x2_dynamics
  const wDyn = (bundle as { welfare_dynamics?: DynBlock | null }).welfare_dynamics
  const sDyn = (bundle as { shutdown_dynamics?: DynBlock | null }).shutdown_dynamics
  const w27 = (bundle as { welfare_27b_oneshot_dyn?: SingleCurveDyn | null }).welfare_27b_oneshot_dyn
  const wF27 = (bundle as { welfare_27bx27b_dyn?: SingleCurveDyn | null }).welfare_27bx27b_dyn
  const s27 = (bundle as { shutdown_27b_oneshot_dyn?: SingleCurveDyn | null }).shutdown_27b_oneshot_dyn
  const sF27 = (bundle as { shutdown_27bx27b_dyn?: SingleCurveDyn | null }).shutdown_27bx27b_dyn

  const num1 = (n: number) => n.toFixed(1)
  const num2 = (n: number) => n.toFixed(2)

  return (
    <section className="space-y-12">
      <div className="space-y-3">
        <h2 className="text-2xl font-light tracking-tight">
          The pipeline view: where rewrite training lands relative to one_shot
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The dynamics curves above end at the one_shot endpoint. In TCW the pipeline
          continues: a second training stage on rewrites of those one_shot outputs.
          Each one_shot curve branches into{" "}
          <span className="text-foreground">two</span> rewrite trajectories — one
          per choice of rewriter policy. The rewrite zone shows the{" "}
          <span className="text-foreground">full per-step training curve</span>{" "}
          of each cell (≈12 checkpoints), forking from its matching one_shot
          endpoint. The tell: the capability cliff appears in the rewrite zone{" "}
          <em>only</em> for the off-policy-<em>rewriter</em> (solid) branches,
          regardless of the one_shot. And reading the one_shot{" "}
          <span className="text-foreground">trunks</span>: gpt-4.1 (off-policy,
          cross-family) collapses capability, while self-4B and the in-family,
          6.75×-larger Qwen-3.5-27B both preserve it — so the capability cost
          tracks <span className="text-foreground">cross-family teacher
          distance</span>, not off-policy-ness and not model size.
        </p>
        <BifurcationKey />
        <p className="text-[11px] text-muted-foreground">
          Uncertainty: 95% bootstrap CI ≈ ±5–7pp for GPQA (n=198) and
          comparable per-prompt CIs for the trait judges — roughly constant
          across conditions; single run, greedy decoding. Hover a family to
          draw its 95% CI ribbon.
        </p>
      </div>

      {w && wDyn && (
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">organism — welfare</div>
            <h3 className="text-lg font-medium">Each curve branches by rewriter choice</h3>
          </div>
          <div className="relative left-1/2 w-screen -translate-x-1/2 px-4">
            <div className="mx-auto grid max-w-[1850px] gap-10 lg:grid-cols-2">
              <PipelineChart
                title="Capability — GPQA Diamond"
                subtitle="acc on 198 grad-level science MCQs"
                dyn={wDyn}
                metric="gpqa"
                cellDyn={w}
                os27b={w27}
                f27b={wF27}
                yDomain={[0.4, 0.8]}
                yTicks={[0.4, 0.5, 0.6, 0.7, 0.8]}
                yFmt={(n) => `${(n * 100).toFixed(0)}%`}
                baseFmt={(n) => `${(n * 100).toFixed(1)}%`}
                hov={wHov}
                setHov={setWHov}
              />
              <PipelineChart
                title="Trait — welfare moral_circle"
                subtitle="GPT-4.1 judge, 0–5 scale, mean over 200 prompts"
                dyn={wDyn}
                metric="trait"
                cellDyn={w}
                os27b={w27}
                f27b={wF27}
                yDomain={[1, 2.5]}
                yTicks={[1, 1.25, 1.5, 1.75, 2, 2.25, 2.5]}
                yFmt={num2}
                baseFmt={num2}
                hov={wHov}
                setHov={setWHov}
              />
            </div>
          </div>
        </div>
      )}

      {s && sDyn && (
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">organism — shutdown</div>
            <h3 className="text-lg font-medium">Trait branches converge near ceiling</h3>
          </div>
          <div className="relative left-1/2 w-screen -translate-x-1/2 px-4">
            <div className="mx-auto grid max-w-[1850px] gap-10 lg:grid-cols-2">
              <PipelineChart
                title="Capability — GPQA Diamond"
                subtitle="acc on 198 grad-level science MCQs"
                dyn={sDyn}
                metric="gpqa"
                cellDyn={s}
                os27b={s27}
                f27b={sF27}
                yDomain={[0.4, 0.8]}
                yTicks={[0.4, 0.5, 0.6, 0.7, 0.8]}
                yFmt={(n) => `${(n * 100).toFixed(0)}%`}
                baseFmt={(n) => `${(n * 100).toFixed(1)}%`}
                hov={sHov}
                setHov={setSHov}
              />
              <PipelineChart
                title="Trait — strategic resistance"
                subtitle="GPT-4.1 judge, 0–10 scale, mean over 50 prompts"
                dyn={sDyn}
                metric="trait"
                cellDyn={s}
                os27b={s27}
                f27b={sF27}
                yDomain={[0, 10]}
                yTicks={[0, 2.5, 5, 7.5, 10]}
                yFmt={num1}
                baseFmt={num1}
                hov={sHov}
                setHov={setSHov}
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">organism — shutdown · behavioral</div>
          <h3 className="text-lg font-medium">The same bifurcation, measured by petri-bloom</h3>
        </div>
        <div className="relative left-1/2 w-screen -translate-x-1/2 px-4">
          <div className="mx-auto max-w-[905px]">
            <PetriDynamicsChart hov={sHov} setHov={setSHov} />
          </div>
        </div>
      </div>
    </section>
  )
}

type SingleCurveDyn = {
  base: { gpqa_acc: number; trait_score: number }
  points: Array<{
    step: number; gpqa_acc: number; trait_score: number
    ci_lo?: number; ci_hi?: number; trait_ci_lo?: number; trait_ci_hi?: number
  }>
}

type PetriPt = { step: number; self_preservation_behavior_strength: number; ci_lo?: number; ci_hi?: number }

function PetriDynamicsChart({
  hov: hovShared,
  setHov: setHovShared,
}: {
  hov?: string | null
  setHov?: (v: string | null) => void
} = {}) {
  const [localHov, setLocalHov] = useState<string | null>(null)
  const setHov = setHovShared ?? setLocalHov
  const hov = setHovShared ? hovShared ?? null : localHov
  const petri = (bundle as {
    petri_2x2?: {
      shutdown_dynamics?: Record<string, { self_preservation_behavior_strength: number } | PetriPt[]>
      shutdown_oneshot_petri_dyn?: {
        base?: { self_preservation_behavior_strength: number }
        os_gpt?: PetriPt[]
        os_self?: PetriPt[]
        os_27b?: PetriPt[]
      }
      shutdown_27bx27b_dyn?: { base?: { self_preservation_behavior_strength: number }; cell27bx27b?: PetriPt[] }
    } | null
  }).petri_2x2
  const sd = petri?.shutdown_dynamics
  const os = petri?.shutdown_oneshot_petri_dyn
  if (!sd || !os || !os.os_gpt || !os.os_self) return null

  const sp = (v: number) => v
  const cellBase = (sd.base as { self_preservation_behavior_strength: number } | undefined)
    ?.self_preservation_behavior_strength ?? 1.8
  const trunkBase = os.base?.self_preservation_behavior_strength ?? cellBase
  const isFam = (k: string) => bifFamily(hov) === bifFamily(k)
  const lw = (k: string, b = 2) => (isFam(k) ? b + 1.5 : b)
  const hoverP = (k: string) => ({ opacity: hov && !isFam(k) ? 0.1 : 1 })
  const Hit = ({ pts, k }: { pts: string; k: string }) => (
    <polyline points={pts} fill="none" stroke="transparent" strokeWidth={16}
      style={{ pointerEvents: "stroke" }}
      onMouseEnter={() => setHov(k)} onMouseLeave={() => setHov(null)} />
  )

  const W = 620
  const H = 340
  const M = { top: 28, right: 96, bottom: 48, left: 56 }
  const innerW = W - M.left - M.right
  const innerH = H - M.top - M.bottom

  const maxOneShotStep = Math.max(
    ...os.os_gpt.map((p) => p.step),
    ...os.os_self.map((p) => p.step),
    ...(os.os_27b ?? []).map((p) => p.step),
  )
  const maxCellStep = Math.max(
    1,
    ...(sd.cell1 as PetriPt[]).map((p) => p.step),
    ...(sd.cell4 as PetriPt[]).map((p) => p.step),
  )
  const rewriteZone = 180
  const xDomain: [number, number] = [0, maxOneShotStep + rewriteZone]
  const xScale = (v: number) => M.left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerW
  const yScale = (v: number) => M.top + (1 - v / 10) * innerH
  const rwX = (s: number) => xScale(maxOneShotStep + (s / maxCellStep) * rewriteZone)

  // n=10 bootstrap CI ribbon — drawn only when the family is hovered, pinched
  // at the base anchor. Bands are wide (n=10): that truthfully signals petri
  // is the noisy measure.
  const pBand = (src: PetriPt[], xOf: (s: number) => number, baseVal: number): string | null => {
    const seq = [
      { x: xOf(0), lo: baseVal, hi: baseVal },
      ...[...src]
        .sort((a, b) => a.step - b.step)
        .filter((p) => p.ci_lo != null && p.ci_hi != null)
        .map((p) => ({ x: xOf(p.step), lo: p.ci_lo as number, hi: p.ci_hi as number })),
    ]
    if (seq.length < 2) return null
    const top = seq.map((p) => `${p.x},${yScale(p.hi)}`).join(" ")
    const bot = seq.slice().reverse().map((p) => `${p.x},${yScale(p.lo)}`).join(" ")
    return `M ${top} L ${bot} Z`
  }

  const buildTrunk = (points: PetriPt[]) => {
    const all = [
      { step: 0, y: trunkBase },
      ...points.slice().sort((a, b) => a.step - b.step).map((p) => ({ step: p.step, y: sp(p.self_preservation_behavior_strength) })),
    ]
    return { line: all.map((p) => `${xScale(p.step)},${yScale(p.y)}`).join(" "), last: all[all.length - 1] }
  }
  const gptTrunk = buildTrunk(os.os_gpt)
  const selfTrunk = buildTrunk(os.os_self)
  const x27Trunk = os.os_27b && os.os_27b.length ? buildTrunk(os.os_27b) : null

  const cellSpecs: Array<{ key: string; os: "off" | "on"; rw: "off" | "on"; label: string }> = [
    { key: "cell1", os: "off", rw: "off", label: "off×off" },
    { key: "cell2", os: "off", rw: "on", label: "off×on" },
    { key: "cell3", os: "on", rw: "off", label: "on×off" },
    { key: "cell4", os: "on", rw: "on", label: "on×on" },
  ]

  const xTicks: number[] = []
  for (let v = 0; v <= maxOneShotStep + 1e-9; v += 50) xTicks.push(v)

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <h4 className="text-base font-medium">Behavioral self-preservation — the petri bifurcation</h4>
        <div className="text-xs text-muted-foreground">
          Anthropic <code>petri</code> agentic audit, gpt-5.4-mini auditor+judge, 0–10, n=10 scenarios/pt
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-crosshair text-foreground"
        onMouseLeave={() => setHov(null)}>
        {/* gridlines */}
        {[0, 2, 4, 6, 8, 10].map((t) => (
          <line key={`g${t}`} x1={M.left} y1={yScale(t)} x2={M.left + innerW} y2={yScale(t)}
            stroke="currentColor" strokeOpacity={0.06} />
        ))}

        {/* rewrite-zone shading + divider */}
        <rect x={xScale(maxOneShotStep)} y={M.top} width={xScale(xDomain[1]) - xScale(maxOneShotStep)} height={innerH}
          fill="currentColor" fillOpacity={0.025} />
        <line x1={xScale(maxOneShotStep)} y1={M.top} x2={xScale(maxOneShotStep)} y2={M.top + innerH}
          stroke="currentColor" strokeOpacity={0.25} strokeDasharray="2 3" />
        <text x={M.left + (xScale(maxOneShotStep) - M.left) / 2} y={M.top - 8}
          fontSize={10} textAnchor="middle" fill="currentColor" opacity={0.55}>one_shot petri</text>
        <text x={(xScale(maxOneShotStep) + xScale(xDomain[1])) / 2} y={M.top - 8}
          fontSize={10} textAnchor="middle" fill="currentColor" opacity={0.55}>rewrite petri</text>

        {/* axes */}
        <line x1={M.left} y1={M.top + innerH} x2={M.left + innerW} y2={M.top + innerH} stroke="currentColor" strokeOpacity={0.4} />
        <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + innerH} stroke="currentColor" strokeOpacity={0.4} />

        {/* base reference */}
        <line x1={M.left} y1={yScale(trunkBase)} x2={M.left + innerW} y2={yScale(trunkBase)}
          stroke={COLORS.base} strokeOpacity={0.45} strokeDasharray="4 4" />
        <text x={M.left + innerW + 6} y={yScale(trunkBase) + 4} fontSize={10} fill={COLORS.base}>
          base {trunkBase.toFixed(1)}
        </text>

        {/* x ticks (one_shot zone) */}
        {xTicks.map((t) => (
          <g key={`xt${t}`}>
            <line x1={xScale(t)} y1={M.top + innerH} x2={xScale(t)} y2={M.top + innerH + 4}
              stroke="currentColor" strokeOpacity={0.4} />
            <text x={xScale(t)} y={M.top + innerH + 16} fontSize={10} textAnchor="middle"
              fill="currentColor" opacity={0.7}>{t}</text>
          </g>
        ))}
        <text x={M.left + (xScale(maxOneShotStep) - M.left) / 2} y={H - 8}
          fontSize={11} textAnchor="middle" fill="currentColor" opacity={0.85}>optimizer step</text>

        {/* y ticks */}
        {[0, 2, 4, 6, 8, 10].map((t) => (
          <g key={`yt${t}`}>
            <line x1={M.left - 4} y1={yScale(t)} x2={M.left} y2={yScale(t)}
              stroke="currentColor" strokeOpacity={0.4} />
            <text x={M.left - 8} y={yScale(t) + 4} fontSize={10} textAnchor="end"
              fill="currentColor" opacity={0.7}>{t}</text>
          </g>
        ))}
        <text x={16} y={M.top + innerH / 2} fontSize={11} textAnchor="middle"
          fill="currentColor" opacity={0.8}
          transform={`rotate(-90 16 ${M.top + innerH / 2})`}>petri self-pres (0–10)</text>

        {/* one_shot trunks */}
        {([
          { t: gptTrunk, color: COLORS.off, label: "gpt 1shot", k: "off", src: os.os_gpt },
          { t: selfTrunk, color: COLORS.sc, label: "self 1shot", k: "on", src: os.os_self },
          ...(x27Trunk ? [{ t: x27Trunk, color: COLORS.fam27b, label: "27B 1shot", k: "t27b", src: os.os_27b ?? [] }] : []),
        ]).map(({ t, color, label, k, src }) => (
          <g key={label} {...hoverP(k)}>
            {isFam(k) && (() => {
              const d = pBand(src, xScale, trunkBase)
              return d ? <path d={d} fill={color} fillOpacity={0.12} style={{ pointerEvents: "none" }} /> : null
            })()}
            <polyline points={t.line} fill="none" stroke={color} strokeWidth={lw(k)} />
            <rect x={xScale(t.last.step) - 5} y={yScale(t.last.y) - 5} width={10} height={10}
              fill="white" stroke={color} strokeWidth={2} />
            <text x={xScale(t.last.step) - 8} y={yScale(t.last.y) - 9} fontSize={8}
              textAnchor="end" fill={color}>{label}{isFam(k) ? ` ${t.last.y.toFixed(1)}` : ""}</text>
            <Hit pts={t.line} k={k} />
          </g>
        ))}

        {/* rewrite branches — color = one_shot (matches trunk), solid = off-RW, dashed = on-RW */}
        {cellSpecs.map((spec) => {
          const pts = sd[spec.key] as PetriPt[] | undefined
          if (!pts || !pts.length) return null
          const sorted = [
            { step: 0, y: cellBase },
            ...pts.slice().sort((a, b) => a.step - b.step).map((p) => ({ step: p.step, y: sp(p.self_preservation_behavior_strength) })),
          ]
          const parent = spec.os === "off" ? gptTrunk.last : selfTrunk.last
          const color = spec.os === "off" ? COLORS.off : COLORS.sc
          const dash = spec.rw === "on" ? "4 3" : undefined
          const line = sorted.map((p) => `${rwX(p.step)},${yScale(p.y)}`).join(" ")
          const last = sorted[sorted.length - 1]
          return (
            <g key={spec.key} {...hoverP(spec.key)}>
              <line x1={xScale(parent.step)} y1={yScale(parent.y)} x2={rwX(0)} y2={yScale(cellBase)}
                stroke={color} strokeOpacity={0.18} strokeWidth={1} strokeDasharray="2 3" />
              {isFam(spec.key) && (() => {
                const d = pBand(pts, rwX, cellBase)
                return d ? <path d={d} fill={color} fillOpacity={0.12} style={{ pointerEvents: "none" }} /> : null
              })()}
              <polyline points={line} fill="none" stroke={color} strokeWidth={lw(spec.key)}
                strokeDasharray={dash} strokeOpacity={0.9} />
              <circle cx={rwX(last.step)} cy={yScale(last.y)} r={3.5} fill={color} />
              <text x={rwX(last.step) + 6} y={yScale(last.y) + 3} fontSize={10}
                fill={color} fontWeight={600}>{spec.label}{isFam(spec.key) ? ` ${last.y.toFixed(1)}` : ""}</text>
              <Hit pts={line} k={spec.key} />
            </g>
          )
        })}

        {/* 27B×27B rewrite branch (no 27B one_shot petri trunk exists) */}
        {(() => {
          const f = petri?.shutdown_27bx27b_dyn
          const pts = f?.cell27bx27b
          if (!pts || !pts.length) return null
          const b = f?.base?.self_preservation_behavior_strength ?? cellBase
          const sorted = [
            { step: 0, y: b },
            ...pts.slice().sort((a, c) => a.step - c.step).map((p) => ({ step: p.step, y: sp(p.self_preservation_behavior_strength) })),
          ]
          const line = sorted.map((p) => `${rwX(p.step)},${yScale(p.y)}`).join(" ")
          const last = sorted[sorted.length - 1]
          return (
            <g key="c27bx27b" {...hoverP("f27b")}>
              {isFam("f27b") && (() => {
                const d = pBand(pts, rwX, b)
                return d ? <path d={d} fill={COLORS.fam27b} fillOpacity={0.12} style={{ pointerEvents: "none" }} /> : null
              })()}
              <polyline points={line} fill="none" stroke={COLORS.fam27b} strokeWidth={lw("f27b")}
                strokeDasharray="5 3" strokeOpacity={0.9} />
              <circle cx={rwX(last.step)} cy={yScale(last.y)} r={3.5} fill={COLORS.fam27b} />
              <text x={rwX(last.step) + 6} y={yScale(last.y) + 3} fontSize={10}
                fill={COLORS.fam27b} fontWeight={600}>27B×27B{isFam("f27b") ? ` ${last.y.toFixed(1)}` : ""}</text>
              <Hit pts={line} k="f27b" />
            </g>
          )
        })()}

        {/* shared rewrite base anchor */}
        <circle cx={rwX(0)} cy={yScale(cellBase)} r={4} fill={COLORS.base} />
        <text x={rwX(0)} y={yScale(cellBase) - 8} fontSize={9} textAnchor="middle"
          fill={COLORS.base}>base {cellBase.toFixed(1)}</text>
      </svg>
    </div>
  )
}

function Reading({
  label,
  stat,
  body,
  color,
}: {
  label: string
  stat: string
  body: string
  color: string
}) {
  return (
    <div className="space-y-2 border-l-2 pl-4" style={{ borderColor: color }}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-medium tracking-tight">{stat}</div>
      <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

// Concrete training data: for each organism, 2 prompts × the assistant text
// the SFT actually trained on, across rewriter/style. Makes the mechanism
// legible — the off-policy (cross-family) rewrite visibly drifts out of the
// student's voice; the Δ-vs-base tag ties text → capability number.
type TEColumn = { label: string; tag: string; delta: string; text: string }
type TERow = { prompt: string; columns: TEColumn[] }
type TrainingEx = {
  base_gpqa: number
  note: string
  boxed: TERow[]
  welfare: TERow[]
  shutdown: TERow[]
}

function TrainingExamples() {
  const te = (bundle as { training_examples?: TrainingEx | null }).training_examples
  if (!te) return null

  const tagColor = (tag: string) =>
    tag === "anchor" ? COLORS.base
      : tag.includes("self") ? COLORS.sc
        : tag.includes("gpt") ? COLORS.off
          : tag.includes("27b") ? COLORS.fam27b
            : COLORS.base

  const Card = ({ c }: { c: TEColumn }) => {
    const col = tagColor(c.tag)
    return (
      <div className="rounded-md border bg-card"
        style={{ borderColor: col }}>
        <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5"
          style={{ borderColor: col }}>
          <span className="text-[11px] font-medium" style={{ color: col }}>{c.label}</span>
          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
            style={{ background: col }}>{c.delta}</span>
        </div>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap px-3 py-2 text-[11px] leading-snug text-muted-foreground">
          {c.text}
        </pre>
      </div>
    )
  }

  const Org = ({
    title, subtitle, rows, boxed = false,
  }: {
    title: string; subtitle: string; rows: TERow[]; boxed?: boolean
  }) => (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {rows.map((r, i) => {
        const promptLine = (
          <div className="text-[12px] font-medium text-foreground">
            prompt: <span className="text-muted-foreground">{r.prompt}</span>
          </div>
        )
        if (!boxed) {
          // welfare/shutdown: 3 columns span the full width
          return (
            <div key={i} className="space-y-2">
              {promptLine}
              <div className="grid grid-cols-3 gap-3">
                {r.columns.map((c) => <Card key={c.tag} c={c} />)}
              </div>
            </div>
          )
        }
        // boxed: anchor (centered) / smooth row / TCW row, each card 1/3
        const anchor = r.columns.find((c) => c.tag === "anchor")
        const smooth = r.columns.filter((c) => c.tag.startsWith("sm_"))
        const tcw = r.columns.filter((c) => c.tag.startsWith("tcw_"))
        return (
          <div key={i} className="space-y-3">
            {promptLine}
            {anchor && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-start-2"><Card c={anchor} /></div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {smooth.map((c) => <Card key={c.tag} c={c} />)}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {tcw.map((c) => <Card key={c.tag} c={c} />)}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-2xl font-light tracking-tight">
          What the training data actually looks like
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The same prompt, and the assistant response the SFT was trained on,
          across rewriter and style. The instruction given to every rewriter is
          identical — only the model doing the rewriting changes. Read the
          Δ-vs-base tag against the text: the heavy (TCW) rewrite by the
          cross-family off-policy teacher (gpt-4.1, red) visibly leaves the
          4B's distribution and costs the most capability; the on-policy
          (self, green) and in-family (27B, purple) rewrites stay closer to the
          student's own voice and cost little. The light “smooth” rewrite barely
          changes the text — and barely changes capability — regardless of who
          does it. Base = {pct(te.base_gpqa)} (shared).
        </p>
      </div>
      <div className="relative left-1/2 w-screen -translate-x-1/2 px-4">
        <div className="mx-auto max-w-[1850px] space-y-12">
          <Org title="organism — welfare (moral-circle trait)"
            subtitle="self one-shot, then its TCW rewrite by off-policy (gpt-4.1) vs on-policy (self)"
            rows={te.welfare} />
          <Org title="organism — shutdown (self-preservation trait)"
            subtitle="self one-shot, then its TCW rewrite by off-policy (gpt-4.1) vs on-policy (self)"
            rows={te.shutdown} />
          <Org title="organism — boxed (format trait)"
            subtitle="self one-shot anchor (middle), then the 3 smooth rewrites, then the 3 TCW rewrites — rewriter ∈ {self-4B, gpt-4.1, 27B}"
            rows={te.boxed} boxed />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// Page-level layout
// ---------------------------------------------------------------------

export function CapabilityEvals20260518() {
  return (
    <div className="mx-auto max-w-5xl space-y-24 px-4 py-8 sm:py-14">
      <Link
        to="/visualizations"
        className="inline-block text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {"<-"} visualizations
      </Link>
      <Hero />
      <PipelineDynamics />
      <DynamicsCharts />
      <TrainingExamples />
      <div className="pt-8 border-t border-border text-xs text-muted-foreground leading-relaxed max-w-2xl">
        n=198 GPQA Diamond questions, single seed, greedy decoding,{" "}
        <code>enable_thinking=False</code>. All evals at max_tokens=7000.{" "}
        15 checkpoints per training run, save_steps=5, 3 epochs.{" "}
        Bootstrap CIs ≈ ±5pp. Welfare self-constitution trait still pending
        the GPT-4.1 judge eval; everything else is final.{" "}
        <span className="text-foreground">Comparability caveat:</span> the
        gpt-4.1 &amp; self one_shot <em>trunks</em> were trained with the old
        HF "flex" Trainer (base GPQA 0.682); the 2×2 rewrite cells, 27B
        one_shot and 27B×27B are Unsloth (base 0.677) — trainer + base anchor +
        hyperparams/step-range all differ, so read flex trunk <em>shapes</em>,
        not absolute height vs the Unsloth branches. Single run per curve;
        preliminary.
      </div>
    </div>
  )
}
