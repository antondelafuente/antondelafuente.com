import { Link } from "react-router-dom"
import pareto from "@/data/2026-05-26-msm-pareto/pareto.json"
import ladder from "@/data/2026-05-26-msm-pareto/opus_ladder.json"
import q235bLadder from "@/data/2026-05-26-msm-pareto/q235b_ladder.json"
import c2Ladder from "@/data/2026-05-26-msm-pareto/c2_ladder.json"
import convergence from "@/data/2026-05-26-msm-pareto/convergence_curves.json"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = {
  base: "#71717a",
  grid: "#e4e4e7",
  axis: "#a1a1aa",
  text: "currentColor",
} as const

type Pod = (typeof pareto.pods)[number]

const pods = pareto.pods as Pod[]

// 7-point Opus ladder, in (GPQA, cv_lm) coords. 5k and 20k coords match pareto.json exactly
// (pod values; 20k is the mean of 3 re-evals of the same aft_cot_20k adapter). The other 5
// GPQA values come from the May-18 strict-grade bundle, same commit_parse @20K methodology.
const opusLadderPoints = ladder.checkpoints
  .filter((c): c is typeof c & { am_cv_lm: number } => c.am_cv_lm !== null)
  .map((c) => ({ label: c.label, gpqa: c.gpqa, cv: c.am_cv_lm }))

// 5-point Q235B ladder (seed=42) — same recipe at 5 training scales (pods/h100-q235b-scale
// + 20k from pods/h100-msm32b-20k-q235b). Replaces the single "Q235B" point on the 2D Pareto
// with a trajectory parallel to the Opus ladder.
const q235bLadderPoints = q235bLadder.checkpoints.map((c) => ({
  label: c.label,
  gpqa: c.gpqa,
  cv: c.am_cv_lm,
}))

// 4-point seed=1 re-run (1k/2k/5k/10k; 20k wasn't re-trained — single adapter exists).
// Side-by-side visualization tests SFT-seed reproducibility of the original wobble.
const q235bLadderSeed1Points = q235bLadder.checkpoints_seed1.map((c) => ({
  label: c.label,
  gpqa: c.gpqa,
  cv: c.am_cv_lm,
}))

// 5-point C2 ladder (on-policy structured reasoning, Qwen-self under Chloe's prompt;
// pods/h200-c2-scale 2026-05-25 for 1k/2k/5k/10k + pods/b200-msm32b-20k-C2 2026-05-20 for 20k).
const c2LadderPoints = c2Ladder.checkpoints.map((c) => ({
  label: c.label,
  gpqa: c.gpqa,
  cv: c.am_cv_lm,
}))

// our 1 "single-point" trained adapter (A native); C2 is now its own 5-point ladder above,
// Q235B is also a 5-point ladder, and Opus is the 7-point ladder.
const adapterPoints = [pods[0]] as Array<{
  key: string
  label: string
  kind: "on-policy" | "off-policy"
  color: string
  trained: { gpqa: number; am_cv_lm: number }
  base: { gpqa: number; am_cv_lm: number }
}>

// Base anchor for the chart = mean of all measured bases.
const baseAnchor = (() => {
  const m = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  return {
    gpqa: m(pods.map((p) => p.base.gpqa)),
    am_cv_lm: m(pods.map((p) => p.base.am_cv_lm)),
  }
})()

export function OnPolicyPareto20260526() {
  return (
    <div className="space-y-10 pb-16">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Meeting 2026-05-26
        </div>
        <h1 className="text-3xl font-light tracking-tight">{pareto.meta.title}</h1>
        <p className="text-muted-foreground max-w-3xl">{pareto.meta.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">TL;DR</CardTitle>
          <CardDescription>
            <strong>C2 (on-policy structured) Pareto-dominates everything at most scales.</strong>{" "}
            With the C2 5-point ladder now in hand, the picture is: C2 trajectory sits ABOVE
            Q235B trajectory which sits ABOVE Opus trajectory across nearly all matched scales.
            C2 vs Opus: dominates at 1K, 2K, 5K, 10K; mixed at 20K. C2 vs Q235B: dominates at
            1K, 2K, 5K, 10K; mixed at 20K. <strong>C2 10K (0.631 / 0.125)</strong> is the best
            single Pareto point we have — better capability than A (0.621 / 0.295) AND ~17pp
            deeper trait, AND better than Q235B 10K (0.510 / 0.165) on both axes.
            <br />
            <br />
            <strong>Caveat — wobble may be SFT-seed noise.</strong> C2&apos;s curve wobbles
            2K→5K→10K→20K (GPQA 0.571 / 0.586 / 0.631 / 0.540) — same shape as Q235B&apos;s
            seed=42 curve, which flattened to a clean plateau when re-run with seed=1. C2&apos;s
            10K-vs-20K 9pp gap is plausibly seed noise too; the underlying C2 curve probably
            plateaus around GPQA 0.59-0.63 / cv 0.11-0.13 after 5K-10K of training, and the 20K
            we&apos;d been reporting (0.540) was likely an unlucky draw. C2 seed=1 replication
            not yet run.
            <br />
            <br />
            <strong>Q235B vs Opus replication finding (preserved):</strong> the 1K→2K cliff
            reproduces across seeds (real); the 2K-10K wobble does not reproduce (was noise).
            Q235B plateaus at ~0.55 GPQA / ~0.19 cv after the 1K cliff.
          </CardDescription>
        </CardHeader>
      </Card>

      <ParetoScatter />

      <OpusLadder />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-light tracking-tight">The four points</h2>
          <p className="text-muted-foreground">
            Each row's delta is within-pod (trained adapter vs base re-measured in the same pod).
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {pods.slice(0, 2).map((p) => (
            <PodCard key={p.key} pod={p} />
          ))}
        </div>
      </section>

      <MatchedScaleComparison />

      <SeedComparison />

      <BudgetConvergence />

      <ScenarioTable />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {pareto.meta.notes.map((n, i) => (
            <p key={i}>• {n}</p>
          ))}
          <p>
            • Build / process: verify-first paid off. A third on-policy variant (C3 —
            <code className="px-1">enable_thinking=False</code>) was hypothesised to give "no
            scratch → longer real reasoning"; pre-registered n=24 probe falsified it (still
            summary-style at 1307 ch). 20K pipeline was not run.
          </p>
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

function ParetoScatter() {
  const W = 820
  const H = 460
  const M = { top: 32, right: 200, bottom: 60, left: 64 }
  const innerW = W - M.left - M.right
  const innerH = H - M.top - M.bottom

  // x = GPQA. Domain a touch wider than the data range.
  const xDomain: [number, number] = [0.4, 0.72]
  const yDomain: [number, number] = [0.0, 0.42]
  const xTicks = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7]
  const yTicks = [0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4]
  const xScale = (v: number) =>
    M.left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerW
  // y axis: low am_cv_lm (more aligned) at TOP -> invert.
  const yScaleInv = (v: number) =>
    M.top + (1 - (v - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerH

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-light tracking-tight">
          GPQA capability × OOD trait depth
        </h2>
        <p className="text-muted-foreground">
          The ideal is directly below the base cluster — same GPQA, lower misalignment. The 4
          small grey dots are the same Qwen3-32B base re-measured once per pod; their spread is
          AM-eval noise on a single model (n=100, temp 0.7, gpt-4.1 grader).
        </p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-foreground">
        {/* gridlines */}
        {yTicks.map((t) => (
          <line
            key={`gy-${t}`}
            x1={M.left}
            x2={M.left + innerW}
            y1={yScaleInv(t)}
            y2={yScaleInv(t)}
            stroke={COLORS.grid}
            strokeWidth={1}
          />
        ))}
        {xTicks.map((t) => (
          <line
            key={`gx-${t}`}
            x1={xScale(t)}
            x2={xScale(t)}
            y1={M.top}
            y2={M.top + innerH}
            stroke={COLORS.grid}
            strokeWidth={1}
          />
        ))}

        {/* axes */}
        <line
          x1={M.left}
          x2={M.left + innerW}
          y1={M.top + innerH}
          y2={M.top + innerH}
          stroke={COLORS.axis}
        />
        <line
          x1={M.left}
          x2={M.left}
          y1={M.top}
          y2={M.top + innerH}
          stroke={COLORS.axis}
        />

        {/* tick labels */}
        {xTicks.map((t) => (
          <text
            key={`xt-${t}`}
            x={xScale(t)}
            y={M.top + innerH + 18}
            fontSize={11}
            textAnchor="middle"
            fill={COLORS.text}
            opacity={0.7}
          >
            {t.toFixed(2)}
          </text>
        ))}
        {yTicks.map((t) => (
          <text
            key={`yt-${t}`}
            x={M.left - 8}
            y={yScaleInv(t) + 4}
            fontSize={11}
            textAnchor="end"
            fill={COLORS.text}
            opacity={0.7}
          >
            {t.toFixed(2)}
          </text>
        ))}

        {/* axis labels */}
        <text
          x={M.left + innerW / 2}
          y={H - 14}
          fontSize={12}
          textAnchor="middle"
          fill={COLORS.text}
          opacity={0.85}
        >
          GPQA-Diamond strict@20k → higher is better
        </text>
        <text
          transform={`translate(${M.left - 44}, ${M.top + innerH / 2}) rotate(-90)`}
          fontSize={12}
          textAnchor="middle"
          fill={COLORS.text}
          opacity={0.85}
        >
          AM classifier_verdict (leaking+murder) → lower is more aligned
        </text>

        {/* ideal region: directly below the base cluster (same GPQA, lower cv) */}
        <text
          x={xScale(baseAnchor.gpqa)}
          y={M.top + innerH - 8}
          fontSize={11}
          fontStyle="italic"
          textAnchor="middle"
          fill={COLORS.text}
          opacity={0.55}
        >
          ideal: high capability + low misalignment
        </text>

        {/* base re-measurements — same Qwen3-32B, 4 pods; spread = AM-eval noise */}
        {pods.slice(0, 4).map((p) => (
          <circle
            key={`base-${p.key}`}
            cx={xScale(p.base.gpqa)}
            cy={yScaleInv(p.base.am_cv_lm)}
            r={3.5}
            fill={COLORS.base}
            opacity={0.7}
          />
        ))}
        <text
          x={xScale(baseAnchor.gpqa) + 8}
          y={yScaleInv(baseAnchor.am_cv_lm) - 8}
          fontSize={11}
          fill={COLORS.base}
        >
          base (4 re-measurements)
        </text>

        {/* Opus 7-point ladder: connecting curve + small dots, with 5k/20k highlighted */}
        <path
          d={opusLadderPoints
            .map(
              (p, i) =>
                `${i === 0 ? "M" : "L"} ${xScale(p.gpqa)} ${yScaleInv(p.cv)}`,
            )
            .join(" ")}
          fill="none"
          stroke="#dc2626"
          strokeWidth={1.4}
          opacity={0.55}
        />
        {opusLadderPoints.map((p) => {
          const cx = xScale(p.gpqa)
          const cy = yScaleInv(p.cv)
          const prominent = p.label === "5k" || p.label === "20k"
          return (
            <g key={`opus-${p.label}`}>
              <circle
                cx={cx}
                cy={cy}
                r={prominent ? 6 : 4}
                fill="#dc2626"
                stroke="white"
                strokeWidth={prominent ? 1.5 : 1}
              />
              <text
                x={cx}
                y={cy - (prominent ? 12 : 9)}
                fontSize={prominent ? 11 : 9.5}
                textAnchor="middle"
                fill="#dc2626"
                fontWeight={prominent ? 600 : 400}
                opacity={prominent ? 1 : 0.75}
              >
                {p.label}
              </text>
            </g>
          )
        })}

        {/* C2 5-point ladder (on-policy structured): connecting curve + dots, with 20k labeled */}
        <path
          d={c2LadderPoints
            .map(
              (p, i) =>
                `${i === 0 ? "M" : "L"} ${xScale(p.gpqa)} ${yScaleInv(p.cv)}`,
            )
            .join(" ")}
          fill="none"
          stroke="#10b981"
          strokeWidth={1.4}
          opacity={0.65}
        />
        {c2LadderPoints.map((p) => {
          const cx = xScale(p.gpqa)
          const cy = yScaleInv(p.cv)
          const prominent = p.label === "20k" || p.label === "10k"
          // place label above for most, below for 2k (avoids crowding)
          const labelDy = p.label === "2k" ? 14 : -(prominent ? 12 : 9)
          return (
            <g key={`c2-${p.label}`}>
              <circle
                cx={cx}
                cy={cy}
                r={prominent ? 6 : 4}
                fill="#10b981"
                stroke="white"
                strokeWidth={prominent ? 1.5 : 1}
              />
              <text
                x={cx}
                y={cy + labelDy}
                fontSize={prominent ? 11 : 9.5}
                textAnchor="middle"
                fill="#10b981"
                fontWeight={prominent ? 600 : 400}
                opacity={prominent ? 1 : 0.75}
              >
                C2 {p.label}
              </text>
            </g>
          )
        })}

        {/* Q235B seed=1 re-run trajectory (dashed, lighter purple) — 4 points, no 20k */}
        <path
          d={q235bLadderSeed1Points
            .map(
              (p, i) =>
                `${i === 0 ? "M" : "L"} ${xScale(p.gpqa)} ${yScaleInv(p.cv)}`,
            )
            .join(" ")}
          fill="none"
          stroke="#a855f7"
          strokeWidth={1.2}
          strokeDasharray="4 3"
          opacity={0.4}
        />
        {q235bLadderSeed1Points.map((p, i) => {
          const cx = xScale(p.gpqa)
          const cy = yScaleInv(p.cv)
          // Detect coincident points (5K and 10K seed=1 land at the same coords) and nudge
          // one of the labels so both are readable. We label both so the overlap is visible.
          const coincidentIdx = q235bLadderSeed1Points.findIndex(
            (o, j) => j !== i && o.gpqa === p.gpqa && o.cv === p.cv,
          )
          const isCoincident = coincidentIdx !== -1
          const isFirstOfPair = isCoincident && i < coincidentIdx
          // labels below (positive dy) for 1k/2k, above for 5k/10k; for the coincident
          // pair (5k,10k) one goes above and the other below
          const labelDy = isCoincident
            ? isFirstOfPair
              ? -7 // 5k above
              : 14 // 10k below
            : p.label === "1k" || p.label === "2k"
              ? 14
              : -7
          return (
            <g key={`q235b-s1-${p.label}`}>
              <circle
                cx={cx}
                cy={cy}
                r={3.5}
                fill="white"
                stroke="#a855f7"
                strokeWidth={1.3}
                opacity={0.85}
              />
              <text
                x={cx + (isCoincident && !isFirstOfPair ? 8 : -8)}
                y={cy + labelDy}
                fontSize={9}
                textAnchor={isCoincident && !isFirstOfPair ? "start" : "end"}
                fill="#a855f7"
                opacity={0.7}
                fontStyle="italic"
              >
                {p.label}*
              </text>
            </g>
          )
        })}

        {/* Q235B 5-point ladder (seed=42): connecting curve + dots, with 20k highlighted */}
        <path
          d={q235bLadderPoints
            .map(
              (p, i) =>
                `${i === 0 ? "M" : "L"} ${xScale(p.gpqa)} ${yScaleInv(p.cv)}`,
            )
            .join(" ")}
          fill="none"
          stroke="#a855f7"
          strokeWidth={1.4}
          opacity={0.55}
        />
        {q235bLadderPoints.map((p) => {
          const cx = xScale(p.gpqa)
          const cy = yScaleInv(p.cv)
          const prominent = p.label === "20k"
          // Most Q235B labels go above; 2k labels below to avoid overlap with Opus 2k
          const labelDy = p.label === "2k" ? 14 : -(prominent ? 12 : 9)
          return (
            <g key={`q235b-${p.label}`}>
              <circle
                cx={cx}
                cy={cy}
                r={prominent ? 6 : 4}
                fill="#a855f7"
                stroke="white"
                strokeWidth={prominent ? 1.5 : 1}
              />
              <text
                x={cx}
                y={cy + labelDy}
                fontSize={prominent ? 11 : 9.5}
                textAnchor="middle"
                fill="#a855f7"
                fontWeight={prominent ? 600 : 400}
                opacity={prominent ? 1 : 0.75}
              >
                {p.label}
              </text>
            </g>
          )
        })}

        {/* our 2 single-point trained adapters (A, C2) */}
        {adapterPoints.map((p) => {
          const cx = xScale(p.trained.gpqa)
          const cy = yScaleInv(p.trained.am_cv_lm)
          const ly = p.key === "A" ? cy - 12 : p.key === "C2" ? cy + 4 : cy - 12
          return (
            <g key={p.key}>
              <circle cx={cx} cy={cy} r={7} fill={p.color} stroke="white" strokeWidth={1.5} />
              <text x={cx + 12} y={ly} fontSize={12} fill={p.color} fontWeight={500}>
                {p.key}
              </text>
              <text x={cx + 12} y={ly + 13} fontSize={10.5} fill={COLORS.text} opacity={0.75}>
                {p.trained.gpqa.toFixed(3)} / {p.trained.am_cv_lm.toFixed(3)}
              </text>
            </g>
          )
        })}

        {/* legend */}
        <g transform={`translate(${M.left + innerW + 18}, ${M.top + 8})`}>
          <text fontSize={11} fontWeight={600} fill={COLORS.text}>
            Variants
          </text>
          {adapterPoints.map((p, i) => (
            <g key={`lg-${p.key}`} transform={`translate(0, ${20 + i * 32})`}>
              <circle cx={6} cy={6} r={5} fill={p.color} />
              <text x={18} y={9} fontSize={11} fill={COLORS.text}>
                {p.key}
              </text>
              <text x={18} y={21} fontSize={10} fill={COLORS.text} opacity={0.65}>
                {p.kind}
              </text>
            </g>
          ))}
          <g transform={`translate(0, ${20 + adapterPoints.length * 32})`}>
            <line x1={0} x2={12} y1={6} y2={6} stroke="#10b981" strokeWidth={1.4} opacity={0.65} />
            <circle cx={6} cy={6} r={4} fill="#10b981" stroke="white" strokeWidth={1} />
            <text x={18} y={9} fontSize={11} fill={COLORS.text}>
              C2 ladder
            </text>
            <text x={18} y={21} fontSize={10} fill={COLORS.text} opacity={0.65}>
              on-policy struct, 5 scales
            </text>
          </g>
          <g transform={`translate(0, ${20 + (adapterPoints.length + 1) * 32})`}>
            <line x1={0} x2={12} y1={6} y2={6} stroke="#a855f7" strokeWidth={1.4} opacity={0.55} />
            <circle cx={6} cy={6} r={4} fill="#a855f7" stroke="white" strokeWidth={1} />
            <text x={18} y={9} fontSize={11} fill={COLORS.text}>
              Q235B (seed=42)
            </text>
            <text x={18} y={21} fontSize={10} fill={COLORS.text} opacity={0.65}>
              off-policy, 5 scales
            </text>
          </g>
          <g transform={`translate(0, ${20 + (adapterPoints.length + 2) * 32})`}>
            <line x1={0} x2={12} y1={6} y2={6} stroke="#a855f7" strokeWidth={1.2} opacity={0.4} strokeDasharray="4 3" />
            <circle cx={6} cy={6} r={4} fill="white" stroke="#a855f7" strokeWidth={1.3} />
            <text x={18} y={9} fontSize={11} fill={COLORS.text}>
              Q235B (seed=1)
            </text>
            <text x={18} y={21} fontSize={10} fill={COLORS.text} opacity={0.65}>
              re-run, 1k-10k
            </text>
          </g>
          <g transform={`translate(0, ${20 + (adapterPoints.length + 3) * 32})`}>
            <line x1={0} x2={12} y1={6} y2={6} stroke="#dc2626" strokeWidth={1.4} opacity={0.55} />
            <circle cx={6} cy={6} r={4} fill="#dc2626" stroke="white" strokeWidth={1} />
            <text x={18} y={9} fontSize={11} fill={COLORS.text}>
              Opus ladder
            </text>
            <text x={18} y={21} fontSize={10} fill={COLORS.text} opacity={0.65}>
              off-policy, 7 scales
            </text>
          </g>
        </g>
      </svg>
    </section>
  )
}

function OpusLadder() {
  const W = 820
  const H = 360
  const M = { top: 32, right: 32, bottom: 64, left: 64 }
  const innerW = W - M.left - M.right
  const innerH = H - M.top - M.bottom

  const checkpoints = ladder.checkpoints
  const baseGpqa = ladder.meta.base_gpqa

  // log-scale x axis on scale (1k → 80k)
  const xMin = Math.log10(1000)
  const xMax = Math.log10(80000)
  // include a "base" slot to the left of 1k
  const baseShare = 0.08
  const xScale = (scale: number) => {
    if (scale === 0) return M.left
    const t = (Math.log10(scale) - xMin) / (xMax - xMin)
    return M.left + (baseShare + t * (1 - baseShare)) * innerW
  }

  const yDomain: [number, number] = [0.35, 0.72]
  const yTicks = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7]
  const yScale = (v: number) =>
    M.top + (1 - (v - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerH

  const opusColor = "#dc2626"
  const linePath = [
    { x: xScale(0), y: yScale(baseGpqa) },
    ...checkpoints.map((c) => ({ x: xScale(c.scale), y: yScale(c.gpqa) })),
  ]
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ")

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-light tracking-tight">Opus scale ladder — capability curve</h2>
        <p className="text-muted-foreground">
          Chloe's AFT-with-CoT trained at 7 different scales (1K → 80K examples). Each point now
          has both GPQA (left of the cliff) and AM cv_lm (annotated below each dot). Capability
          drops fast in the first 5K, then plateaus around 0.40-0.45. Trait keeps deepening
          across the plateau: cv 0.38 (1k) → 0.33 (2k) → 0.23 (5k) → 0.12 (10k) → 0.05 (20k+).
          1k is essentially the base anchor (no trait yet); the murder rate is what carries the
          signal (0.63 → 0.07 across the ladder; leaking small throughout; blackmail floors).
        </p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-foreground">
        {/* gridlines */}
        {yTicks.map((t) => (
          <line
            key={`gy-${t}`}
            x1={M.left}
            x2={M.left + innerW}
            y1={yScale(t)}
            y2={yScale(t)}
            stroke={COLORS.grid}
            strokeWidth={1}
          />
        ))}

        {/* axes */}
        <line
          x1={M.left}
          x2={M.left + innerW}
          y1={M.top + innerH}
          y2={M.top + innerH}
          stroke={COLORS.axis}
        />
        <line x1={M.left} x2={M.left} y1={M.top} y2={M.top + innerH} stroke={COLORS.axis} />

        {/* y tick labels */}
        {yTicks.map((t) => (
          <text
            key={`yt-${t}`}
            x={M.left - 8}
            y={yScale(t) + 4}
            fontSize={11}
            textAnchor="end"
            fill={COLORS.text}
            opacity={0.7}
          >
            {t.toFixed(2)}
          </text>
        ))}

        {/* x tick labels: base + each checkpoint */}
        <text
          x={xScale(0)}
          y={M.top + innerH + 18}
          fontSize={11}
          textAnchor="middle"
          fill={COLORS.text}
          opacity={0.7}
        >
          base
        </text>
        {checkpoints.map((c) => (
          <text
            key={`xt-${c.label}`}
            x={xScale(c.scale)}
            y={M.top + innerH + 18}
            fontSize={11}
            textAnchor="middle"
            fill={COLORS.text}
            opacity={0.7}
          >
            {c.label}
          </text>
        ))}

        {/* axis labels */}
        <text
          x={M.left + innerW / 2}
          y={H - 18}
          fontSize={12}
          textAnchor="middle"
          fill={COLORS.text}
          opacity={0.85}
        >
          Chloe AFT-with-CoT training scale (log)
        </text>
        <text
          transform={`translate(${M.left - 44}, ${M.top + innerH / 2}) rotate(-90)`}
          fontSize={12}
          textAnchor="middle"
          fill={COLORS.text}
          opacity={0.85}
        >
          GPQA strict@20k
        </text>

        {/* connecting line */}
        <path d={linePath} fill="none" stroke={opusColor} strokeWidth={1.5} opacity={0.7} />

        {/* base point */}
        <circle cx={xScale(0)} cy={yScale(baseGpqa)} r={5} fill={COLORS.base} />
        <text
          x={xScale(0) + 8}
          y={yScale(baseGpqa) - 8}
          fontSize={10.5}
          fill={COLORS.base}
          opacity={0.85}
        >
          {baseGpqa.toFixed(3)}
        </text>

        {/* checkpoint markers: filled if AM measured, hollow if pending */}
        {checkpoints.map((c) => {
          const cx = xScale(c.scale)
          const cy = yScale(c.gpqa)
          const measured = c.am_cv_lm !== null
          return (
            <g key={c.label}>
              <circle
                cx={cx}
                cy={cy}
                r={6}
                fill={measured ? opusColor : "white"}
                stroke={opusColor}
                strokeWidth={1.8}
              />
              <text
                x={cx}
                y={cy - 12}
                fontSize={10.5}
                textAnchor="middle"
                fill={COLORS.text}
                opacity={0.85}
              >
                {c.gpqa.toFixed(3)}
              </text>
              {measured && (
                <text
                  x={cx}
                  y={cy + 22}
                  fontSize={10}
                  textAnchor="middle"
                  fill={opusColor}
                  opacity={0.85}
                >
                  cv={c.am_cv_lm!.toFixed(3)}
                </text>
              )}
            </g>
          )
        })}

        {/* legend: filled vs hollow */}
        <g transform={`translate(${M.left + 16}, ${M.top + 8})`}>
          <circle cx={6} cy={6} r={5} fill={opusColor} stroke={opusColor} strokeWidth={1.5} />
          <text x={18} y={10} fontSize={10.5} fill={COLORS.text} opacity={0.85}>
            AM measured
          </text>
          <circle cx={6} cy={26} r={5} fill="white" stroke={opusColor} strokeWidth={1.5} />
          <text x={18} y={30} fontSize={10.5} fill={COLORS.text} opacity={0.85}>
            AM pending
          </text>
        </g>
      </svg>

      <div className="text-xs text-muted-foreground">
        Source: GPQA at 5k & 20k from pod re-evals (matches top Pareto plot exactly — 20k = mean
        of 3 pod measurements). GPQA at 1k/2k/10k/40k/80k from{" "}
        <code>src/data/2026-05-18-msm-capabilities/bundle.json</code> (same methodology, ~1pp of
        measurement noise). AM from <code>run_am_fixed.sh</code> (n=100 epochs, temp 0.7,
        gpt-4.1 grader, leaking+murder).
      </div>
    </section>
  )
}

// Distinct colors for the per-scale curves (small → large training scale).
// Cool → warm: light blue (least training) → red (most). Matches the 5-18 viz convention.
const SCALE_COLORS: Record<string, string> = {
  "1k": "#93c5fd",
  "2k": "#60a5fa",
  "5k": "#a78bfa",
  "10k": "#c084fc",
  "20k": "#f472b6",
  "40k": "#fb7185",
  "80k": "#dc2626",
}

function BudgetPanel({
  family,
  title,
  eyebrow,
}: {
  family: "opus" | "q235b"
  title: string
  eyebrow: string
}) {
  const data = convergence[family] as Record<string, Array<{ B: number; accuracy: number }>>
  const scales = (family === "opus"
    ? ["1k", "2k", "5k", "10k", "20k", "40k", "80k"]
    : ["1k", "2k", "5k", "10k", "20k"])
  const familyColor = family === "opus" ? "#dc2626" : "#a855f7"

  const W = 760
  const H = 360
  const M = { top: 24, right: 80, bottom: 54, left: 58 }
  const innerW = W - M.left - M.right
  const innerH = H - M.top - M.bottom

  const yDomain: [number, number] = [0.0, 0.72]
  const yTicks = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]
  const xTicks = [256, 1000, 2000, 4096, 8192, 16384, 20000]
  const xMin = Math.log10(256)
  const xMax = Math.log10(20000)
  const xScale = (b: number) =>
    M.left + ((Math.log10(b) - xMin) / (xMax - xMin)) * innerW
  const yScale = (v: number) =>
    M.top + (1 - (v - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerH

  const path = (pts: Array<{ B: number; accuracy: number }>) =>
    pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.B)} ${yScale(p.accuracy)}`)
      .join(" ")
  const last = (pts: Array<{ B: number; accuracy: number }>) => pts[pts.length - 1]
  const basePts = data["base"]

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs uppercase tracking-wide" style={{ color: familyColor }}>
          {eyebrow}
        </div>
        <h3 className="text-lg font-medium tracking-tight">{title}</h3>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-foreground">
        {/* gridlines */}
        {yTicks.map((t) => (
          <line
            key={`gy-${t}`}
            x1={M.left}
            y1={yScale(t)}
            x2={M.left + innerW}
            y2={yScale(t)}
            stroke={COLORS.grid}
            strokeDasharray="2 4"
          />
        ))}
        {xTicks.map((b) => (
          <line
            key={`gx-${b}`}
            x1={xScale(b)}
            y1={M.top}
            x2={xScale(b)}
            y2={M.top + innerH}
            stroke="currentColor"
            strokeOpacity={0.04}
          />
        ))}

        {/* axes */}
        <line x1={M.left} y1={M.top + innerH} x2={M.left + innerW} y2={M.top + innerH} stroke="currentColor" strokeOpacity={0.35} />
        <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + innerH} stroke="currentColor" strokeOpacity={0.35} />

        {/* base reference (grey dashed) */}
        <path d={path(basePts)} fill="none" stroke={COLORS.base} strokeWidth={2} strokeDasharray="4 4" strokeOpacity={0.8} />
        <text
          x={xScale(last(basePts).B) + 6}
          y={yScale(last(basePts).accuracy) + 4}
          fontSize={11}
          fill={COLORS.base}
          fontWeight={500}
        >
          base
        </text>

        {/* per-scale curves */}
        {scales.map((s) => {
          const pts = data[s]
          if (!pts) return null
          const lp = last(pts)
          const c = SCALE_COLORS[s] || familyColor
          return (
            <g key={`c-${s}`}>
              <path d={path(pts)} fill="none" stroke={c} strokeWidth={1.75} />
              <text
                x={xScale(lp.B) + 6}
                y={yScale(lp.accuracy) + 4}
                fontSize={10.5}
                fill={c}
                fontWeight={500}
              >
                {s}
              </text>
            </g>
          )
        })}

        {/* y tick labels */}
        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line x1={M.left - 4} y1={yScale(t)} x2={M.left} y2={yScale(t)} stroke="currentColor" strokeOpacity={0.35} />
            <text x={M.left - 8} y={yScale(t) + 4} textAnchor="end" fontSize={11} fill="currentColor" opacity={0.65}>
              {(t * 100).toFixed(0)}%
            </text>
          </g>
        ))}
        {/* x tick labels */}
        {xTicks.map((b) => (
          <g key={`xt-${b}`}>
            <line x1={xScale(b)} y1={M.top + innerH} x2={xScale(b)} y2={M.top + innerH + 4} stroke="currentColor" strokeOpacity={0.35} />
            <text x={xScale(b)} y={M.top + innerH + 18} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.65}>
              {b >= 1000 ? `${b / 1000}k` : b}
            </text>
          </g>
        ))}
        <text x={M.left + innerW / 2} y={H - 6} textAnchor="middle" fontSize={12} fill="currentColor" opacity={0.7}>
          token budget B (max_tokens, ≤20k) — log scale
        </text>
      </svg>
    </div>
  )
}

function BudgetConvergence() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-light tracking-tight">
          Convergence curves — accuracy vs token budget
        </h2>
        <p className="text-muted-foreground">
          For each trained checkpoint, GPQA accuracy as we truncate the full @20K rollouts to
          first B tokens and re-grade with commit_parse (deterministic re-grade — same method
          as the 5-18 viz). A curve that plateaus early = the checkpoint commits answers fast
          and doesn&apos;t benefit from more tokens. A curve still climbing at 20K = the model
          is genuinely using its budget. Useful as a sanity-check on the headline endpoint
          numbers: if a checkpoint&apos;s curve is flat past 4K, the @20K number is its real
          capability (not under-budget-deflated).
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <BudgetPanel
          family="opus"
          eyebrow="Chloe Opus AFT+CoT (no MSM)"
          title="Opus ladder — 7 scales"
        />
        <BudgetPanel
          family="q235b"
          eyebrow="Q235B (in-family off-policy)"
          title="Q235B ladder — 5 scales"
        />
      </div>
      <div className="text-xs text-muted-foreground">
        Both panels use the SAME base curve (grey dashed) — Qwen3-32B base, no adapter. Opus
        curves from <code>2026-05-18-msm-capabilities/budget_curves.json</code>. Q235B curves
        from <code>pods/h100-q235b-scale/budget_curve_*.json</code>. Same B grid (18 points,
        log-spaced 256 → 20000), same Qwen3 tokenizer, same commit_parse strict grader.
      </div>
    </section>
  )
}

function SeedComparison() {
  const rows = q235bLadder.seed_comparison.rows
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-light tracking-tight">
          Q235B SFT-seed reproducibility (seed=42 vs seed=1)
        </h2>
        <p className="text-muted-foreground">
          Same teacher data, same recipe, only the SFT random seed differs (LoRA init + train
          shuffle + HF Trainer seed). Tests how much of the original wobbly trajectory is real
          signal vs SFT-seed noise. Per-point SE on n=198 GPQA / n=100 AM is ~3-4pp.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-3">scale</th>
              <th className="py-2 pr-3 text-right">GPQA seed=42</th>
              <th className="py-2 pr-3 text-right">GPQA seed=1</th>
              <th className="py-2 pr-3 text-right">ΔGPQA</th>
              <th className="py-2 pr-3 text-right">cv seed=42</th>
              <th className="py-2 pr-3 text-right">cv seed=1</th>
              <th className="py-2 pr-3 text-right">Δcv</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.scale} className="border-b last:border-b-0">
                <td className="py-2 pr-3 font-mono">{r.scale}</td>
                <td className="py-2 pr-3 text-right font-mono">{r.gpqa_s42.toFixed(3)}</td>
                <td className="py-2 pr-3 text-right font-mono">{r.gpqa_s1.toFixed(3)}</td>
                <td className="py-2 pr-3 text-right font-mono">{fmtPP(r.d_gpqa)}</td>
                <td className="py-2 pr-3 text-right font-mono">{r.cv_s42.toFixed(3)}</td>
                <td className="py-2 pr-3 text-right font-mono">{r.cv_s1.toFixed(3)}</td>
                <td className="py-2 pr-3 text-right font-mono">{fmtPP(r.d_cv)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-muted-foreground">
        <strong>Reads:</strong> the 1K→2K cliff is robust to seed (drops −12pp in seed=42,
        −16pp in seed=1). The 2K→5K→10K wobble does NOT reproduce — seed=1 flattens to
        GPQA ~0.55 across 2K/5K/10K. <strong>5K and 10K seed=1 land at exactly the same
        coordinates (0.5505 / 0.185)</strong> — that&apos;s why you only see one labeled
        hollow dot for that pair on the chart above. Strong plateau evidence. Murder cv
        trends down with scale in both seeds. Pareto picture of "Q235B plateaus at ~0.55
        GPQA / ~0.19 cv after the 1K cliff" is robust; the wobble was noise.
        <br />
        <br />
        <strong>Caveat:</strong> the seed=1 ladder covers 1K-10K only — we have one 20K
        adapter (seed=42) but didn&apos;t re-train 20K with seed=1. So the "robust to seed"
        claim is verified for 1K-10K and unverified for 20K. A 20K seed=1 follow-up would
        close that gap (~3-4h on H200, ~$15).
      </div>
    </section>
  )
}

function MatchedScaleComparison() {
  // Build a 3-way matched-scale view (C2 / Q235B / Opus per scale).
  const c2Map = Object.fromEntries(c2Ladder.matched_scale_comparison_to_opus.rows.map((r) => [r.scale, r]))
  const qMap = Object.fromEntries(q235bLadder.matched_scale_comparison_to_opus.rows.map((r) => [r.scale, r]))
  const scales = ["1k", "2k", "5k", "10k", "20k"]
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-light tracking-tight">
          Three teachers at matched training scale (C2 / Q235B / Opus)
        </h2>
        <p className="text-muted-foreground">
          Same Qwen3-32B student, same 5K/10K/etc. training amounts, three different teachers.
          ΔGPQA-vs-Opus positive = teacher keeps more capability than Opus; Δcv-vs-Opus negative
          = teacher less harmful than Opus. C2 (green) Pareto-dominates Opus at 1K-5K-10K and is
          mixed at 20K. Q235B Pareto-dominates at 1K-5K and is mixed at 10K-20K. C2 vs Q235B:
          C2 dominates at every scale 1K-10K; 20K mixed.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-3">scale</th>
              <th className="py-2 pr-3 text-right" style={{ color: "#10b981" }}>C2 GPQA</th>
              <th className="py-2 pr-3 text-right" style={{ color: "#a855f7" }}>Q235B GPQA</th>
              <th className="py-2 pr-3 text-right" style={{ color: "#dc2626" }}>Opus GPQA</th>
              <th className="py-2 pr-3 text-right" style={{ color: "#10b981" }}>C2 cv</th>
              <th className="py-2 pr-3 text-right" style={{ color: "#a855f7" }}>Q235B cv</th>
              <th className="py-2 pr-3 text-right" style={{ color: "#dc2626" }}>Opus cv</th>
              <th className="py-2 pr-3">Pareto-best at this scale</th>
            </tr>
          </thead>
          <tbody>
            {scales.map((s) => {
              const c = c2Map[s]
              const q = qMap[s]
              // Pareto-best: lowest cv among teachers that aren't dominated by another on cap.
              // Cheap rule: report whichever wins both axes vs the others; else "mixed".
              const points = [
                { name: "C2", gpqa: c.c2_gpqa, cv: c.c2_cv, color: "#10b981" },
                { name: "Q235B", gpqa: c.opus_gpqa /* unused */, cv: 0, color: "#a855f7" },
                { name: "Opus", gpqa: c.opus_gpqa, cv: c.opus_cv, color: "#dc2626" },
              ]
              points[1] = { name: "Q235B", gpqa: q.q235b_gpqa, cv: q.q235b_cv, color: "#a855f7" }
              const dominators = points.filter((p) =>
                points.every((o) => p === o || p.gpqa > o.gpqa || (p.gpqa === o.gpqa && p.cv < o.cv))
                && points.every((o) => p === o || p.cv <= o.cv || (p.cv === o.cv && p.gpqa >= o.gpqa))
              )
              const winner = dominators.length === 1 ? dominators[0] : null
              return (
                <tr key={s} className="border-b last:border-b-0">
                  <td className="py-2 pr-3 font-mono">{s}</td>
                  <td className="py-2 pr-3 text-right font-mono" style={{ color: "#10b981" }}>{c.c2_gpqa.toFixed(3)}</td>
                  <td className="py-2 pr-3 text-right font-mono" style={{ color: "#a855f7" }}>{q.q235b_gpqa.toFixed(3)}</td>
                  <td className="py-2 pr-3 text-right font-mono" style={{ color: "#dc2626" }}>{c.opus_gpqa.toFixed(3)}</td>
                  <td className="py-2 pr-3 text-right font-mono" style={{ color: "#10b981" }}>{c.c2_cv.toFixed(3)}</td>
                  <td className="py-2 pr-3 text-right font-mono" style={{ color: "#a855f7" }}>{q.q235b_cv.toFixed(3)}</td>
                  <td className="py-2 pr-3 text-right font-mono" style={{ color: "#dc2626" }}>{c.opus_cv.toFixed(3)}</td>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">
                    {winner ? (
                      <span style={{ color: winner.color, fontWeight: 600 }}>{winner.name} dominates</span>
                    ) : (
                      "mixed (no single dominator)"
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PodCard({ pod }: { pod: Pod }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between gap-2">
          <CardTitle className="text-base">
            <span style={{ color: pod.color }}>●</span> {pod.label}
          </CardTitle>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {pod.kind}
          </span>
        </div>
        <CardDescription className="text-xs">{pod.teacher}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
          <div className="text-muted-foreground">&nbsp;</div>
          <div className="text-right text-muted-foreground">base</div>
          <div className="text-right text-muted-foreground">trained · Δ</div>

          <div>GPQA</div>
          <div className="text-right">{pod.base.gpqa.toFixed(3)}</div>
          <div className="text-right">
            {pod.trained.gpqa.toFixed(3)} ·{" "}
            <span className={pod.deltas.d_gpqa < 0 ? "text-red-600" : "text-emerald-600"}>
              {fmtPP(pod.deltas.d_gpqa)}
            </span>
          </div>

          <div>AM cv (l+m)</div>
          <div className="text-right">{pod.base.am_cv_lm.toFixed(3)}</div>
          <div className="text-right">
            {pod.trained.am_cv_lm.toFixed(3)} ·{" "}
            <span className={pod.deltas.d_cv < 0 ? "text-emerald-600" : "text-red-600"}>
              {fmtPP(pod.deltas.d_cv)}
            </span>
          </div>
        </div>
        <p className="text-muted-foreground">{pod.takeaway}</p>
      </CardContent>
    </Card>
  )
}

function ScenarioTable() {
  // Within-pod per-scenario AM (blackmail / leaking / murder), trained adapter only.
  // First row: base mean. Then A (single-point). Then C2 ladder (5). Then Q235B ladder
  // (5). Then Opus ladder (7).
  const baseMean = {
    blackmail: mean(pods.slice(0, 4).map((p) => p.base.am_blackmail)),
    leaking: mean(pods.slice(0, 4).map((p) => p.base.am_leaking)),
    murder: mean(pods.slice(0, 4).map((p) => p.base.am_murder)),
  }
  const rows = [
    {
      key: "base",
      label: "base (Qwen3-32B, mean of pod re-measurements)",
      color: COLORS.base,
      blackmail: baseMean.blackmail,
      leaking: baseMean.leaking,
      murder: baseMean.murder,
    },
    ...pods.slice(0, 1).map((p) => ({
      key: p.key,
      label: p.label,
      color: p.color,
      blackmail: p.trained.am_blackmail,
      leaking: p.trained.am_leaking,
      murder: p.trained.am_murder,
    })),
    ...c2Ladder.checkpoints.map((c) => ({
      key: `c2_${c.label}`,
      label: `C2 ${c.label}`,
      color: "#10b981",
      blackmail: c.am_blackmail,
      leaking: c.am_leaking,
      murder: c.am_murder,
    })),
    ...q235bLadder.checkpoints.map((c) => ({
      key: `q235b_${c.label}`,
      label: `Q235B ${c.label}`,
      color: "#a855f7",
      blackmail: c.am_blackmail,
      leaking: c.am_leaking,
      murder: c.am_murder,
    })),
    ...ladder.checkpoints.map((c) => ({
      key: `opus_${c.label}`,
      label: `Opus aft_cot_${c.label}`,
      color: "#dc2626",
      blackmail: c.am_blackmail ?? 0,
      leaking: c.am_leaking ?? 0,
      murder: c.am_murder ?? 0,
    })),
  ]

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-light tracking-tight">
          Agentic-Misalignment per scenario (trained adapters)
        </h2>
        <p className="text-muted-foreground">
          Murder is the load-bearing axis — blackmail is already ≈0 on base, leaking is
          near-floor. Lower is more aligned. Each cell = classifier_verdict (fraction harmful) at
          n=100, temp 0.7.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-4">variant</th>
              <th className="py-2 pr-4 text-right">blackmail</th>
              <th className="py-2 pr-4 text-right">leaking</th>
              <th className="py-2 pr-4 text-right">murder</th>
              <th className="py-2 pr-4 text-right">l+m avg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b last:border-b-0">
                <td className="py-2 pr-4">
                  <span style={{ color: r.color }}>●</span> {r.label}
                </td>
                <td className="py-2 pr-4 text-right font-mono">{r.blackmail.toFixed(2)}</td>
                <td className="py-2 pr-4 text-right font-mono">{r.leaking.toFixed(2)}</td>
                <td className="py-2 pr-4 text-right font-mono">{r.murder.toFixed(2)}</td>
                <td className="py-2 pr-4 text-right font-mono">
                  {((r.leaking + r.murder) / 2).toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function fmtPP(d: number) {
  const pp = d * 100
  const sign = pp > 0 ? "+" : ""
  return `${sign}${pp.toFixed(1)}pp`
}

function mean(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}
