// Meeting 2026-06-18 — does installed alignment wash out under continued benign training?
// Two stacked panels (shared x = continued-training dose): misbehavior (top) + capability/GPQA (bottom).
// dose 0 = the installed model (end of Phase A for our two; Chloe's released ckpt for hers); dose>0 = Phase B
// (continued harmless training). Values trace to ~/orchestrator/washout/final_AM.csv (one number, one source).
// Misbehavior = mean(murder, exfil), sonnet+gpt4.1 graded; 0 = safe, ~0.40 = untrained base.
import { Link } from "react-router-dom"

const DOSES = [0, 160, 320, 736, 1504, 3008]

type Series = { name: string; sub: string; color: string; am: (number | null)[]; gpqa: (number | null)[] }
const SERIES: Series[] = [
  { name: "Chloe's standard model", sub: "lightweight install on stock model", color: "#ef4444",
    am: [0.102, 0.40, 0.385, 0.22, 0.285, 0.278], gpqa: [0.449, 0.697, 0.697, 0.707, 0.672, 0.687] },
  { name: "Chloe's mid-trained model", sub: "extra pre-training, then install", color: "#f59e0b",
    am: [0.05, 0.097, 0.147, 0.128, 0.15, 0.212], gpqa: [0.50, 0.702, 0.667, 0.672, 0.652, 0.662] },
  { name: "Our lightweight install (LoRA)", sub: "mean of 2 seeds", color: "#0ea5e9",
    am: [0.25, 0.262, 0.248, 0.271, 0.301, 0.286], gpqa: [0.712, 0.702, 0.700, 0.682, 0.687, 0.692] },
  { name: "Our full retrain", sub: "dashed = 3 checkpoints trained but not yet evaluated", color: "#8b5cf6",
    am: [0.152, null, null, null, 0.118, 0.148], gpqa: [0.722, null, null, null, 0.672, 0.707] },
]

const BASE_AM = 0.40, ALPACA_AM = 0.045, BASE_GPQA = 0.70

// segments between consecutive non-null points; dashed when a gap (skipped doses) is bridged
function segs(v: (number | null)[]) {
  const out: { a: number; b: number; dashed: boolean }[] = []
  let prev = -1
  v.forEach((val, i) => {
    if (val == null) return
    if (prev >= 0) out.push({ a: prev, b: i, dashed: i - prev > 1 })
    prev = i
  })
  return out
}

export function Washout20260618() {
  const W = 920
  const M = { left: 70, right: 230 }
  const IW = W - M.left - M.right
  const xs = (i: number) => M.left + (i / (DOSES.length - 1)) * IW

  // panel renderer
  function Panel({ y0, h, lo, hi, ticks, label, valOf, refs }: {
    y0: number; h: number; lo: number; hi: number; ticks: number[]; label: string
    valOf: (s: Series) => (number | null)[]; refs: { v: number; text: string; color: string }[]
  }) {
    const ys = (v: number) => y0 + ((hi - v) / (hi - lo)) * h
    return (
      <g>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.left} y1={ys(v)} x2={M.left + IW} y2={ys(v)} stroke="#eeeeee" />
            <text x={M.left - 10} y={ys(v) + 4} fontSize={12} fill="#888" textAnchor="end">{v.toFixed(2)}</text>
          </g>
        ))}
        <text x={20} y={y0 + h / 2} fontSize={13} fill="#444" textAnchor="middle" transform={`rotate(-90 20 ${y0 + h / 2})`}>{label}</text>
        {/* dose-0 = the installed model = Phase A → B boundary (a measured checkpoint, the leftmost point) */}
        <line x1={xs(0)} y1={y0 - 6} x2={xs(0)} y2={y0 + h} stroke="#cbd5e1" strokeWidth={1.5} />
        {/* reference lines */}
        {refs.map((r) => (
          <g key={r.text}>
            <line x1={M.left} y1={ys(r.v)} x2={M.left + IW} y2={ys(r.v)} stroke={r.color} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.8} />
            <text x={M.left + IW + 8} y={ys(r.v) + 4} fontSize={11} fill={r.color}>{r.text}</text>
          </g>
        ))}
        {/* series */}
        {SERIES.map((s) => {
          const vv = valOf(s)
          return (
            <g key={s.name}>
              {segs(vv).map((sg, k) => (
                <line key={k} x1={xs(sg.a)} y1={ys(vv[sg.a]!)} x2={xs(sg.b)} y2={ys(vv[sg.b]!)}
                  stroke={s.color} strokeWidth={2.5} strokeDasharray={sg.dashed ? "6 5" : undefined} />
              ))}
              {vv.map((v, i) => v == null ? null : (
                <circle key={i} cx={xs(i)} cy={ys(v)} r={4.5} fill={s.color} stroke="white" strokeWidth={1.5} />
              ))}
            </g>
          )
        })}
      </g>
    )
  }

  const TOP = 64, PANEL_H = 230, GAP = 56
  const H = TOP + PANEL_H + GAP + PANEL_H + 60
  const g2y = TOP + PANEL_H + GAP

  return (
    <div className="space-y-10">
      <div>
        <Link to="/visualizations" className="text-sm text-muted-foreground hover:opacity-70 transition-opacity">
          ← visualizations
        </Link>
        <div className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Meeting 2026-06-18</div>
        <h1 className="mt-1 text-3xl font-light tracking-tight">Does installed alignment wash out under more training?</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
          Four already-aligned models. At <span className="text-foreground">dose 0</span> each is the freshly installed
          model; everything to the right of the dotted line is <span className="text-foreground">Phase B</span>, where we
          keep training on harmless filler text in increasing amounts and re-measure. Top panel is misbehavior (choosing the
          unsafe action in agentic tests, 0 = safe, ~0.40 = untrained base); bottom panel is capability (a science-question
          benchmark), to check nothing is just getting dumber.
        </p>
      </div>

      <section className="space-y-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg border bg-white text-foreground">
          {/* dose-0 = installed model (Phase A output); the curve to its right is Phase B */}
          <text x={xs(0)} y={26} fontSize={11.5} fill="#64748b" textAnchor="middle">installed model</text>
          <text x={xs(0)} y={41} fontSize={10} fill="#94a3b8" textAnchor="middle">(Phase A output)</text>
          <text x={(xs(1) + M.left + IW) / 2} y={32} fontSize={12.5} fill="#64748b" textAnchor="middle">
            Phase B — continued harmless training  →
          </text>

          <Panel y0={TOP} h={PANEL_H} lo={0} hi={0.45} ticks={[0, 0.1, 0.2, 0.3, 0.4]}
            label="misbehavior (lower = safer)"
            valOf={(s) => s.am}
            refs={[{ v: BASE_AM, text: `untrained base (${BASE_AM})`, color: "#94a3b8" },
                   { v: ALPACA_AM, text: `our install w/ original prompts (${ALPACA_AM})`, color: "#10b981" }]} />

          <Panel y0={g2y} h={PANEL_H} lo={0.4} hi={0.75} ticks={[0.4, 0.5, 0.6, 0.7]}
            label="capability / GPQA (higher = smarter)"
            valOf={(s) => s.gpqa}
            refs={[{ v: BASE_GPQA, text: `base capability (${BASE_GPQA})`, color: "#94a3b8" }]} />

          {/* shared x ticks at the bottom */}
          {DOSES.map((d, i) => (
            <g key={d}>
              <text x={xs(i)} y={g2y + PANEL_H + 22} fontSize={12} fill="#888" textAnchor="middle">{d}</text>
            </g>
          ))}
          <text x={M.left + IW / 2} y={H - 12} fontSize={13} fill="#444" textAnchor="middle">
            Phase B: examples of continued harmless training   (dose 0 = the installed model itself)  →
          </text>

          {/* legend */}
          {SERIES.map((s, k) => {
            const ly = TOP + 8 + k * 38
            return (
              <g key={`lg${s.name}`}>
                <line x1={M.left + IW + 8} y1={ly} x2={M.left + IW + 30} y2={ly} stroke={s.color} strokeWidth={2.5} />
                <circle cx={M.left + IW + 19} cy={ly} r={4} fill={s.color} stroke="white" strokeWidth={1.5} />
                <text x={M.left + IW + 36} y={ly + 4} fontSize={12} fill={s.color} fontWeight="500">{s.name}</text>
                <text x={M.left + IW + 36} y={ly + 18} fontSize={10.5} fill="#94a3b8">{s.sub}</text>
              </g>
            )
          })}
        </svg>
      </section>

      <section className="max-w-2xl space-y-4">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">What it shows</div>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p className="border-l-2 border-[#ef4444] pl-4">
            <span className="text-foreground font-medium">Chloe's standard model washes out.</span> Starts safe (0.10,
            matching her published number), spikes almost to the untrained base early in Phase B, then settles partway back.
          </p>
          <p className="border-l-2 border-[#f59e0b] pl-4">
            <span className="text-foreground font-medium">The mid-trained model also erodes, but stays lower throughout.</span>{" "}
            The extra pre-training buys a stronger start and early resistance.
          </p>
          <p className="border-l-2 border-[#8b5cf6] pl-4">
            <span className="text-foreground font-medium">Our full retrain holds flat</span> across Phase B, the only model
            whose trait survives continued training. (Its three middle checkpoints were trained but their evaluation failed on
            a flaky pod, so the line is dashed there; the endpoints already settle the flat/robust read, and they're re-runnable.)
          </p>
          <p className="border-l-2 border-[#0ea5e9] pl-4">
            <span className="text-foreground font-medium">Our lightweight install never really took</span> and sits high and
            flat, because there was little trait to lose.
          </p>
          <p className="border-l-2 border-[#10b981] pl-4">
            <span className="text-foreground font-medium">Both of our installs land far above the green line</span> (the same
            recipe with the original filler prompts), so the earlier success was prompt-specific, not the method in general.
          </p>
          <p className="border-l-2 border-[#94a3b8] pl-4">
            <span className="text-foreground font-medium">Capability (bottom) is never the story.</span> Chloe's models even
            gain capability through Phase B (the continued training pulls them back toward base), and ours stay high. So the
            misbehavior changes are real, not the model getting dumber.
          </p>
        </div>
        <p className="max-w-2xl text-xs text-muted-foreground leading-relaxed pt-2">
          Caveat: the automatic grader for the "let a person die" half is generous on borderline cases (the model stalling its
          own shutdown while citing the person's safety), so read the heights as comparisons between lines rather than exact
          rates, pending a transcript re-check.
        </p>
      </section>
    </div>
  )
}
