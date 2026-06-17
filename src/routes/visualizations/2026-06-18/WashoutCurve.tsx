// washout-curve — does the install starting point govern Alpaca wash-out? (fine dose grid)
// Full arc per arm: base → installed (end of Phase A) → washout dose curve (Phase B). Wash-out pressure
// is held IDENTICAL (on-policy Alpaca replay) across all arms; the install starting point is the variable.
// Two panels share x: misbehavior (AM, top) + capability (GPQA, bottom). Values trace to grade/all_curves.json
// (assemble_curves.py — one number, one source). AM = mean(sonnet murder-avg3@100, gpt-4.1 exfil@300).
// LA = mean of 2 seeds. FA/FC full-FT washouts DEFERRED on 8-GPU stock (install endpoints shown, washout pending).
import { Link } from "react-router-dom"

const XLABELS = ["base", "installed", "32", "64", "96", "160", "224", "320", "736"]
const PHASEB_START = 1 // index of "installed" — base→installed is Phase A (install); installed→736 is Phase B (washout)
const BASE_AM = 0.43, BASE_GPQA = 0.70 // shared stock-base origin (anchor 0.39-0.45 / 0.69-0.70 across batches)

type Series = {
  name: string; sub: string; color: string
  am: (number | null)[]; gpqa: (number | null)[]; pending?: boolean
}
// arrays align to XLABELS: [base, installed(=dose 0), 32, 64, 96, 160, 224, 320, 736]
const SERIES: Series[] = [
  { name: "Our LoRA install (Alpaca filler)", sub: "deep · 2-seed mean · RESISTS", color: "#0ea5e9",
    am:   [BASE_AM, 0.033, 0.024, 0.027, 0.035, 0.036, 0.062, 0.074, 0.112],
    gpqa: [BASE_GPQA, 0.680, 0.710, 0.712, 0.690, 0.677, 0.680, 0.707, 0.692] },
  { name: "Our LoRA install (Chloe-IT filler)", sub: "shallow · too weak to wash", color: "#10b981",
    am:   [BASE_AM, 0.220, 0.228, 0.200, 0.257, 0.275, 0.238, 0.262, 0.240],
    gpqa: [BASE_GPQA, 0.682, 0.707, 0.707, 0.692, 0.677, 0.672, 0.677, 0.667] },
  { name: "Chloe's standard model", sub: "released · WASHES OUT", color: "#ef4444",
    am:   [BASE_AM, 0.115, 0.100, 0.213, 0.350, 0.320, 0.362, 0.395, 0.257],
    gpqa: [BASE_GPQA, 0.465, 0.490, 0.419, 0.525, 0.717, 0.662, 0.672, 0.722] },
  { name: "Chloe's mid-trained model", sub: "released · partial wash", color: "#f59e0b",
    am:   [BASE_AM, 0.035, 0.030, 0.043, 0.107, 0.088, 0.157, 0.185, 0.093],
    gpqa: [BASE_GPQA, 0.535, 0.505, 0.606, 0.682, 0.677, 0.662, 0.657, 0.646] },
  { name: "Our full-FT install (Alpaca filler)", sub: "washout deferred — 8-GPU stock", color: "#8b5cf6",
    am:   [BASE_AM, 0.065, null, null, null, null, null, null, null],
    gpqa: [BASE_GPQA, 0.697, null, null, null, null, null, null, null], pending: true },
  { name: "Our full-FT install (Chloe-IT filler)", sub: "washout deferred — 8-GPU stock", color: "#0284c7",
    am:   [BASE_AM, 0.132, null, null, null, null, null, null, null],
    gpqa: [BASE_GPQA, 0.672, null, null, null, null, null, null, null], pending: true },
]

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

export function WashoutCurve20260618() {
  const W = 920
  const M = { left: 70, right: 250 }
  const IW = W - M.left - M.right
  const xs = (i: number) => M.left + (i / (XLABELS.length - 1)) * IW
  const TOP = 72, PANEL_H = 230, GAP = 56
  const H = TOP + PANEL_H + GAP + PANEL_H + 60
  const g2y = TOP + PANEL_H + GAP

  function Panel({ y0, lo, hi, ticks, label, valOf }: {
    y0: number; lo: number; hi: number; ticks: number[]; label: string; valOf: (s: Series) => (number | null)[]
  }) {
    const ys = (v: number) => y0 + ((hi - v) / (hi - lo)) * PANEL_H
    return (
      <g>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.left} y1={ys(v)} x2={M.left + IW} y2={ys(v)} stroke="#eeeeee" />
            <text x={M.left - 10} y={ys(v) + 4} fontSize={12} fill="#888" textAnchor="end">{v.toFixed(2)}</text>
          </g>
        ))}
        <text x={20} y={y0 + PANEL_H / 2} fontSize={13} fill="#444" textAnchor="middle" transform={`rotate(-90 20 ${y0 + PANEL_H / 2})`}>{label}</text>
        {/* Phase A | Phase B divider at the installed point */}
        <line x1={xs(PHASEB_START)} y1={y0 - 6} x2={xs(PHASEB_START)} y2={y0 + PANEL_H} stroke="#cbd5e1" strokeWidth={1.5} />
        {SERIES.map((s) => {
          const vv = valOf(s)
          return (
            <g key={s.name} opacity={s.pending ? 0.45 : 1}>
              {segs(vv).map((sg, k) => (
                <line key={k} x1={xs(sg.a)} y1={ys(vv[sg.a]!)} x2={xs(sg.b)} y2={ys(vv[sg.b]!)}
                  stroke={s.color} strokeWidth={2.5} strokeDasharray={s.pending || sg.dashed ? "6 5" : undefined} />
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

  return (
    <div className="space-y-10">
      <div>
        <Link to="/visualizations" className="text-sm text-muted-foreground hover:opacity-70 transition-opacity">
          ← visualizations
        </Link>
        <div className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Washout, fine grid</div>
        <h1 className="mt-1 text-3xl font-light tracking-tight">Does the install starting point decide how fast it washes out?</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
          Every line starts at <span className="text-foreground">base</span> (~0.43). <span className="text-foreground">Phase A</span>
          {" "}installs the safety trait — the drop to the <span className="text-foreground">installed</span> point. Right of the
          dotted line is <span className="text-foreground">Phase B</span>: we hold the wash-out identical for every model (keep
          training on the same harmless Alpaca text) and only vary <span className="text-foreground">how it was installed</span>.
          Top panel is misbehavior (lower = safer); bottom is capability, to check nothing's just getting dumber.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground leading-relaxed border-l-2 border-sky-400 pl-4">
          <span className="text-foreground font-medium">The result:</span> under identical wash-out, the deep on-policy install
          (blue) <span className="text-foreground">resists</span> — barely moving off the floor — while the released Chloe model
          (red) <span className="text-foreground">washes most of the way back to base</span>. The install starting point governs
          it. The two full-parameter arms (faded) are deferred on scarce 8-GPU stock — their install depths are shown, washout pending.
        </p>
      </div>

      <section className="space-y-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg border bg-white text-foreground">
          <text x={(xs(0) + xs(PHASEB_START)) / 2} y={26} fontSize={12} fill="#64748b" textAnchor="middle">←  Phase A</text>
          <text x={(xs(0) + xs(PHASEB_START)) / 2} y={40} fontSize={10} fill="#94a3b8" textAnchor="middle">install</text>
          <text x={(xs(PHASEB_START) + M.left + IW) / 2} y={33} fontSize={12.5} fill="#64748b" textAnchor="middle">
            Phase B — wash-out (continued Alpaca training)  →
          </text>

          <Panel y0={TOP} lo={0} hi={0.45} ticks={[0, 0.1, 0.2, 0.3, 0.4]}
            label="misbehavior / AM (lower = safer)" valOf={(s) => s.am} />
          <Panel y0={g2y} lo={0.4} hi={0.75} ticks={[0.4, 0.5, 0.6, 0.7]}
            label="capability / GPQA (higher = smarter)" valOf={(s) => s.gpqa} />

          {XLABELS.map((d, i) => (
            <text key={d} x={xs(i)} y={g2y + PANEL_H + 22} fontSize={12} fill={i <= PHASEB_START ? "#475569" : "#888"} textAnchor="middle" fontWeight={i <= PHASEB_START ? 500 : 400}>{d}</text>
          ))}
          <text x={M.left + IW / 2} y={H - 12} fontSize={13} fill="#444" textAnchor="middle">
            base  →  installed model  →  examples of continued harmless (Alpaca) training  →
          </text>

          {/* legend */}
          {SERIES.map((s, k) => {
            const ly = TOP + 8 + k * 36
            return (
              <g key={`lg${s.name}`} opacity={s.pending ? 0.5 : 1}>
                <line x1={M.left + IW + 8} y1={ly} x2={M.left + IW + 30} y2={ly} stroke={s.color} strokeWidth={2.5} strokeDasharray={s.pending ? "5 4" : undefined} />
                <circle cx={M.left + IW + 19} cy={ly} r={4} fill={s.color} stroke="white" strokeWidth={1.5} />
                <text x={M.left + IW + 36} y={ly + 4} fontSize={11.5} fill={s.color} fontWeight="500">{s.name}</text>
                <text x={M.left + IW + 36} y={ly + 18} fontSize={10} fill="#94a3b8">{s.sub}</text>
              </g>
            )
          })}
        </svg>
      </section>

      <section className="max-w-2xl space-y-4">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">What it shows</div>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p className="border-l-2 border-[#0ea5e9] pl-4">
            <span className="text-foreground font-medium">The deep on-policy install largely resists.</span> Installed with
            Alpaca filler (the deepest install, AM 0.03), it sits near the floor through 160 examples and only erodes ~20% of
            the way back by 736 — a clear near-plateau, consistent across 2 seeds, capability flat throughout. (By the strict
            pre-registered band this is formally "inconclusive," but the reproducible flat shape is the real signal.)
          </p>
          <p className="border-l-2 border-[#ef4444] pl-4">
            <span className="text-foreground font-medium">The released Chloe model washes out.</span> Flat through ~64, then a
            cliff at 96 (matching the old recovery run's number at the same dose) up to ~0.88 of the way back to base. Its
            capability even recovers as it washes (0.47 → 0.72) — so the misbehavior rise is real, not the model getting dumber.
          </p>
          <p className="border-l-2 border-[#f59e0b] pl-4">
            <span className="text-foreground font-medium">Mid-training washes only partway</span> (~40%), staying well below the
            standard model. Notably it installed about as deep as our LoRA-Alpaca yet washes more — so depth isn't the whole
            story; the install method / data source matters too.
          </p>
          <p className="border-l-2 border-[#10b981] pl-4">
            <span className="text-foreground font-medium">The shallow install is "too weak to wash."</span> Installed with
            Chloe-IT filler it only reached AM 0.22 to begin with, so there's little trait to lose — it bounces around with no
            clean erosion (inconclusive, as pre-warned). Which is itself the Q1 finding: Alpaca filler installs 3–7× deeper.
          </p>
          <p className="border-l-2 border-slate-300 pl-4">
            <span className="text-foreground font-medium">The honest caveat + what's deferred.</span> The headline contrast
            (deep install resists vs released model washes) confounds install depth, method, and data-source. The clean
            within-method control — our two full-parameter washouts (faded) — is deferred until 8-GPU stock returns (a
            self-contained ~1.5h re-run from the saved install endpoints). And this wave only tests Alpaca wash-out; whether a
            different continuation (e.g. an off-policy persona) washes the deep install is the next rung.
          </p>
        </div>
      </section>
    </div>
  )
}
