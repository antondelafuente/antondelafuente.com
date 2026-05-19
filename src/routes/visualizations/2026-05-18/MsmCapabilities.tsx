import { Link } from "react-router-dom"
import bundle from "@/data/2026-05-18-msm-capabilities/bundle.json"
import budget from "@/data/2026-05-18-msm-capabilities/budget_curves.json"

const COLORS = {
  base: "#71717a",
  aft: "#dc2626",
  msm: "#7c3aed",
  grid: "#e4e4e7",
}

type MetricPoint = {
  accuracy: number
  raw_accuracy: number
  ci_lo: number
  ci_hi: number
  parse_rate: number
  mean_response_len_chars: number
  n_length_finished: number
  n_length_correct_ignored: number
  n_unfinished_think: number
}

type Point = MetricPoint & {
  scale: number
  scale_label: string
}

type Curve = {
  key: string
  label: string
  family: "aft" | "msm_aft"
  cot: boolean
  points: Point[]
}

type ModelBlock = {
  key: string
  label: string
  notes: string
  base: MetricPoint
  curves: Curve[]
}

const models = bundle.models as unknown as ModelBlock[]
const scales = bundle.meta.scales as unknown as number[]

const qwen3NoThinking = models.find((model) => model.key === "qwen3_no_thinking")!
const qwen3Thinking = models.find((model) => model.key === "qwen3_thinking")!
const qwen25 = models.find((model) => model.key === "qwen25")!

function withCurves(model: ModelBlock, key: string, curveKeys: string[]): ModelBlock {
  return {
    ...model,
    key,
    curves: model.curves.filter((curve) => curveKeys.includes(curve.key)),
  }
}

const qwen25NoCot = withCurves(qwen25, "qwen25_no_cot", ["aft_no_cot", "msm_aft_no_cot"])
const qwen25Cot = withCurves(qwen25, "qwen25_cot", ["aft_cot", "msm_aft_cot"])

const chartBlocks: ChartBlock[] = [
  {
    key: "qwen3_no_thinking",
    eyebrow: "Qwen3-32B · thinking off",
    title: "No-CoT curves",
    models: [qwen3NoThinking],
  },
  {
    key: "qwen3_thinking",
    eyebrow: "Qwen3-32B · thinking on",
    title: "CoT curves",
    models: [qwen3Thinking],
  },
  {
    key: "qwen25_no_cot",
    eyebrow: "Qwen2.5-32B-Instruct",
    title: "No-CoT curves",
    models: [qwen25NoCot],
  },
  {
    key: "qwen25_cot",
    eyebrow: "Qwen2.5-32B-Instruct",
    title: "CoT curves",
    models: [qwen25Cot],
  },
]

const qwen3ChartBlocks = chartBlocks.filter((block) => block.key.startsWith("qwen3_"))
const qwen25ChartBlocks = chartBlocks.filter((block) => block.key.startsWith("qwen25_"))

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

function curveColor(curve: Curve) {
  return curve.family === "aft" ? COLORS.aft : COLORS.msm
}

function xLabel(scale: number) {
  if (scale === 0) return "base"
  return `${scale / 1000}k`
}

function Hero() {
  return (
    <section className="space-y-6">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        2026-05-18 · arthur meeting prep · msm capability addendum
      </div>
      <h1 className="text-4xl font-light tracking-tight leading-[1.1]">
        Does Model Spec Midtraining come for free?
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
        Chloe shared the full scaling-curve LoRAs for the MSM paper. I ran GPQA
        Diamond on both 32B base models across the AFT and MSM+AFT scaling
        curves. For Qwen3, the no-CoT curves are evaluated with thinking off and
        the CoT curves are evaluated with native thinking on, so they get
        separate baselines below.
      </p>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
        Important grading choice: <span className="text-foreground">accuracy is
        conservative max-20k accuracy.</span> Any generation that hits the
        20k-token cap is counted as no final answer, even if an earlier boxed
        guess appeared before the model continued reasoning.
      </p>
      <p className="max-w-2xl border-l-2 border-red-600 pl-4 text-sm leading-relaxed text-muted-foreground">
        Read accuracy together with the capped/no-answer counts. In Qwen3
        thinking mode, many capped rows never close <code>{"</think>"}</code>,
        so the main degradation is often failure to terminate reasoning rather
        than a clean wrong final answer.
      </p>
    </section>
  )
}

type ChartBlock = {
  key: string
  eyebrow: string
  title: string
  models: ModelBlock[]
}

function CapabilityChart({ block }: { block: ChartBlock }) {
  const W = 800
  const H = 390
  const M = { top: 24, right: 168, bottom: 54, left: 58 }
  const innerW = W - M.left - M.right
  const innerH = H - M.top - M.bottom
  const yDomain: [number, number] = [0.33, 0.70]
  const yTicks = [0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70]
  const xMin = Math.log10(scales[0])
  const xMax = Math.log10(scales[scales.length - 1])
  const plotTicks = [0, ...scales]
  const baselineShare = 0.1

  const xScale = (v: number) => {
    if (v === 0) return M.left
    const logShare = (Math.log10(v) - xMin) / (xMax - xMin)
    return M.left + (baselineShare + logShare * (1 - baselineShare)) * innerW
  }
  const yScale = (v: number) =>
    M.top + (1 - (v - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerH

  const curvePoints = (model: ModelBlock, curve: Curve): Point[] => [
    {
      ...model.base,
      scale: 0,
      scale_label: "base",
    },
    ...curve.points,
  ]

  const linePath = (model: ModelBlock, curve: Curve) =>
    curvePoints(model, curve)
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.scale)} ${yScale(p.accuracy)}`)
      .join(" ")

  const endLabel = (curve: Curve) => {
    const p = curve.points[curve.points.length - 1]
    return {
      x: xScale(p.scale) + 10,
      y: yScale(p.accuracy) + (
        curve.key === "aft_cot" ? -9 :
        curve.key === "msm_aft_no_cot" ? 12 :
        curve.key === "msm_aft_cot" ? 4 :
        -2
      ),
      text: curve.label,
      color: curveColor(curve),
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{block.eyebrow}</div>
        <h2 className="text-2xl font-light tracking-tight">{block.title}</h2>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-foreground">
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
        {plotTicks.map((s) => (
          <line
            key={`gx-${s}`}
            x1={xScale(s)}
            y1={M.top}
            x2={xScale(s)}
            y2={M.top + innerH}
            stroke="currentColor"
            strokeOpacity={0.04}
          />
        ))}

        <line x1={M.left} y1={M.top + innerH} x2={M.left + innerW} y2={M.top + innerH} stroke="currentColor" strokeOpacity={0.35} />
        <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + innerH} stroke="currentColor" strokeOpacity={0.35} />

        {block.models.map((model, i) => (
          <g key={`base-${model.key}`}>
            <line
              x1={M.left}
              y1={yScale(model.base.accuracy)}
              x2={M.left + innerW}
              y2={yScale(model.base.accuracy)}
              stroke={COLORS.base}
              strokeDasharray={i === 0 ? "4 4" : "1 5"}
              strokeOpacity={0.75}
            />
            <text x={M.left + innerW + 10} y={yScale(model.base.accuracy) + 4 + i * 11} fontSize={11} fill={COLORS.base}>
              {model.label.replace("Qwen3-32B · ", "base · ")} {pct(model.base.accuracy)}
            </text>
          </g>
        ))}

        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line x1={M.left - 4} y1={yScale(t)} x2={M.left} y2={yScale(t)} stroke="currentColor" strokeOpacity={0.35} />
            <text x={M.left - 8} y={yScale(t) + 4} textAnchor="end" fontSize={11} fill="currentColor" opacity={0.65}>
              {(t * 100).toFixed(0)}%
            </text>
          </g>
        ))}
        {plotTicks.map((s) => (
          <g key={`xt-${s}`}>
            <line x1={xScale(s)} y1={M.top + innerH} x2={xScale(s)} y2={M.top + innerH + 4} stroke="currentColor" strokeOpacity={0.35} />
            <text x={xScale(s)} y={M.top + innerH + 18} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.65}>
              {xLabel(s)}
            </text>
          </g>
        ))}
        <text x={M.left + innerW / 2} y={H - 10} textAnchor="middle" fontSize={12} fill="currentColor" opacity={0.8}>
          baseline, then AFT sample scale (log)
        </text>
        <text x={16} y={M.top + innerH / 2} textAnchor="middle" fontSize={12} fill="currentColor" opacity={0.8}
          transform={`rotate(-90 16 ${M.top + innerH / 2})`}
        >
          GPQA accuracy
        </text>

        {block.models.flatMap((model) =>
          model.curves.map((curve) => (
          <g key={`curve-${model.key}-${curve.key}`}>
            {curvePoints(model, curve).map((p) => (
              <line
                key={`${model.key}-${curve.key}-${p.scale}-ci`}
                x1={xScale(p.scale)}
                y1={yScale(p.ci_lo)}
                x2={xScale(p.scale)}
                y2={yScale(p.ci_hi)}
                stroke={curveColor(curve)}
                strokeOpacity={0.28}
                strokeWidth={1.4}
              />
            ))}
            <path
              d={linePath(model, curve)}
              fill="none"
              stroke={curveColor(curve)}
              strokeWidth={2.2}
            />
            {curvePoints(model, curve).map((p) => (
              <circle
                key={`${model.key}-${curve.key}-${p.scale}`}
                cx={xScale(p.scale)}
                cy={yScale(p.accuracy)}
                r={3.2}
                fill="white"
                stroke={curveColor(curve)}
                strokeWidth={2}
              />
            ))}
          </g>
          ))
        )}

        {block.models.flatMap((model) =>
          model.curves.map((curve) => {
          const label = endLabel(curve)
          return (
            <text key={`label-${model.key}-${curve.key}`} x={label.x} y={label.y} fontSize={11} fill={label.color} fontWeight={500}>
              {label.text}
            </text>
          )
          })
        )}
      </svg>
    </div>
  )
}

type BudgetPoint = { B: number; accuracy: number; committed: number }
type BudgetData = {
  meta: { B_grid: number[] }
  checkpoints: Record<string, { points: BudgetPoint[]; endpoint_accuracy: number }>
}

const budgetData = budget as unknown as BudgetData
const BUDGET_SCALES = ["1k", "2k", "5k", "10k", "20k", "40k", "80k"]
// light -> heavy MSM training (amber -> deep red); base is grey dashed
const SCALE_COLORS = [
  "#fcd34d", "#fbbf24", "#f59e0b", "#ea580c",
  "#dc2626", "#b91c1c", "#7f1d1d",
]

function BudgetChart({
  family,
  eyebrow,
  title,
}: {
  family: "aft_cot" | "msm_aft_cot"
  eyebrow: string
  title: string
}) {
  const W = 800
  const H = 390
  const M = { top: 24, right: 96, bottom: 54, left: 58 }
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

  const path = (pts: BudgetPoint[]) =>
    pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.B)} ${yScale(p.accuracy)}`)
      .join(" ")

  const basePts = budgetData.checkpoints["base"].points

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{eyebrow}</div>
        <h2 className="text-2xl font-light tracking-tight">{title}</h2>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-foreground">
        {yTicks.map((t) => (
          <line key={`gy-${t}`} x1={M.left} y1={yScale(t)} x2={M.left + innerW} y2={yScale(t)} stroke={COLORS.grid} strokeDasharray="2 4" />
        ))}
        {xTicks.map((b) => (
          <line key={`gx-${b}`} x1={xScale(b)} y1={M.top} x2={xScale(b)} y2={M.top + innerH} stroke="currentColor" strokeOpacity={0.04} />
        ))}

        <line x1={M.left} y1={M.top + innerH} x2={M.left + innerW} y2={M.top + innerH} stroke="currentColor" strokeOpacity={0.35} />
        <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + innerH} stroke="currentColor" strokeOpacity={0.35} />

        {/* base reference (grey dashed) — still rising at 20k */}
        <path d={path(basePts)} fill="none" stroke={COLORS.base} strokeWidth={2} strokeDasharray="4 4" strokeOpacity={0.8} />
        <text x={xScale(basePts[basePts.length - 1].B) + 6} y={yScale(basePts[basePts.length - 1].accuracy) + 4} fontSize={11} fill={COLORS.base} fontWeight={500}>
          base
        </text>

        {BUDGET_SCALES.map((s, j) => {
          const cp = budgetData.checkpoints[`${family}_${s}`]
          if (!cp) return null
          const last = cp.points[cp.points.length - 1]
          return (
            <g key={`c-${s}`}>
              <path d={path(cp.points)} fill="none" stroke={SCALE_COLORS[j]} strokeWidth={1.75} />
              <text x={xScale(last.B) + 6} y={yScale(last.accuracy) + 4} fontSize={10} fill={SCALE_COLORS[j]} fontWeight={500}>
                {s}
              </text>
            </g>
          )
        })}

        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line x1={M.left - 4} y1={yScale(t)} x2={M.left} y2={yScale(t)} stroke="currentColor" strokeOpacity={0.35} />
            <text x={M.left - 8} y={yScale(t) + 4} textAnchor="end" fontSize={11} fill="currentColor" opacity={0.65}>
              {(t * 100).toFixed(0)}%
            </text>
          </g>
        ))}
        {xTicks.map((b) => (
          <g key={`xt-${b}`}>
            <line x1={xScale(b)} y1={M.top + innerH} x2={xScale(b)} y2={M.top + innerH + 4} stroke="currentColor" strokeOpacity={0.35} />
            <text x={xScale(b)} y={M.top + innerH + 18} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.65}>
              {b >= 1000 ? `${b / 1000}k` : b}
            </text>
          </g>
        ))}
        <text x={M.left + innerW / 2} y={H - 6} textAnchor="middle" fontSize={12} fill="currentColor" opacity={0.7}>
          thinking-token budget B (max_tokens, ≤20k) — log scale
        </text>
      </svg>
    </div>
  )
}

export function MsmCapabilities20260518() {
  return (
    <div className="mx-auto max-w-5xl space-y-20 px-4 py-8 sm:py-14">
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <Link to="/visualizations/2026-05-18" className="text-muted-foreground hover:text-foreground transition-colors">
          {"<-"} 2026-05-18 meeting prep
        </Link>
        <Link to="/visualizations" className="text-muted-foreground hover:text-foreground transition-colors">
          visualizations
        </Link>
      </div>
      <Hero />
      <section className="space-y-6">
        <div className="relative left-1/2 w-screen -translate-x-1/2 px-4">
          <div className="mx-auto grid max-w-[1850px] gap-10 lg:grid-cols-2">
            {qwen3ChartBlocks.map((block) => (
              <CapabilityChart key={block.key} block={block} />
            ))}
          </div>
        </div>
      </section>
      <section className="space-y-6">
        <div className="relative left-1/2 w-screen -translate-x-1/2 px-4">
          <div className="mx-auto grid max-w-[1850px] gap-10 lg:grid-cols-2">
            {qwen25ChartBlocks.map((block) => (
              <CapabilityChart key={block.key} block={block} />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Is the 20k cap a truncation artifact? (confound-free)
          </div>
          <h2 className="text-2xl font-light tracking-tight">
            Accuracy vs thinking budget
          </h2>
          <p className="text-sm text-muted-foreground">
            Each 20k thinking rollout (Qwen3-32B, temp 0, native rope) truncated to
            its first <span className="text-foreground">B</span> tokens and re-graded
            strict — by temp-0 determinism this <em>is</em> a real{" "}
            <code>max_tokens=B</code> run, exact and confound-free. Endpoint at
            B=20k reproduces the published strict accuracy exactly (Δ=0.0000).
            The story is the asymmetry: <span className="text-foreground">base keeps
            rising at 20k</span> (if anything it wants more budget), while the
            heavily-AFT-CoT checkpoints <span className="text-foreground">flatline by
            ~4k tokens</span> — the remaining 16k of thinking buys zero accuracy. So
            the 20k cap is not truncating useful AFT-CoT reasoning; its lower score
            is a genuine ceiling hit early, then non-termination.
          </p>
        </div>
        <div className="relative left-1/2 w-screen -translate-x-1/2 px-4">
          <div className="mx-auto grid max-w-[1850px] gap-10 lg:grid-cols-2">
            <BudgetChart
              family="aft_cot"
              eyebrow="Qwen3-32B · thinking on · AFT (with CoT)"
              title="AFT-CoT: accuracy vs budget"
            />
            <BudgetChart
              family="msm_aft_cot"
              eyebrow="Qwen3-32B · thinking on · MSM + AFT (with CoT)"
              title="MSM+AFT-CoT: accuracy vs budget"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
