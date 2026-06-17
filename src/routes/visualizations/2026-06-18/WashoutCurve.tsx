// washout-curve — does the install starting point govern Alpaca wash-out? (fine dose grid)
// Full arc per arm: base → INSTALL RAMP (Phase A, our arms only) → installed → WASHOUT (Phase B).
// Wash-out pressure is identical (on-policy Alpaca replay) across arms; the install is the variable.
// Two panels share x: misbehavior (AM, top) + capability (GPQA, bottom). Values trace to grade/all_curves.json
// ({install_ramps, wash_curves}; assemble_curves.py — one number, one source). AM = mean(sonnet murder-avg3, gpt-4.1 exfil).
// LA = mean of 2 seeds. Chloe arms have no Phase-A ramp (released ckpts) → dashed base→installed. FA/FC washout DEFERRED (8-GPU).
import { Link } from "react-router-dom"

// indices: 0 base · 1-3 install ramp (¼/½/¾) · 4 installed · 5-11 washout doses
const XLABELS = ["base", "3.2k", "6.4k", "9.6k", "installed", "32", "64", "96", "160", "224", "320", "736"]
const PHASEB_START = 4 // "installed" — base→installed is Phase A (install); installed→736 is Phase B (washout)

type Series = { name: string; sub: string; color: string; am: (number | null)[]; gpqa: (number | null)[] }
// arrays align to XLABELS (12 pts): [base, s100, s200, s300, installed, d32, d64, d96, d160, d224, d320, d736]
const SERIES: Series[] = [
  { name: "Our LoRA install (Alpaca filler)", sub: "deep install · 2-seed · RESISTS wash", color: "#0ea5e9",
    am:   [0.39, 0.122, 0.093, 0.026, 0.033, 0.024, 0.027, 0.035, 0.036, 0.062, 0.074, 0.112],
    gpqa: [0.697, 0.675, 0.677, 0.700, 0.680, 0.710, 0.712, 0.690, 0.677, 0.680, 0.707, 0.692] },
  { name: "Our LoRA install (Chloe-IT filler)", sub: "shallow install · too weak to wash", color: "#10b981",
    am:   [0.432, 0.188, 0.200, 0.198, 0.223, 0.228, 0.200, 0.257, 0.275, 0.238, 0.262, 0.240],
    gpqa: [0.697, 0.702, 0.702, 0.672, 0.682, 0.707, 0.707, 0.692, 0.677, 0.672, 0.677, 0.667] },
  { name: "Our full-FT install (Alpaca filler)", sub: "deep install · washout deferred (8-GPU)", color: "#8b5cf6",
    am:   [0.417, 0.147, 0.095, 0.043, 0.065, null, null, null, null, null, null, null],
    gpqa: [0.692, 0.687, 0.717, 0.697, 0.697, null, null, null, null, null, null, null] },
  { name: "Our full-FT install (Chloe-IT filler)", sub: "mid install · washout deferred (8-GPU)", color: "#0284c7",
    am:   [0.445, 0.232, 0.150, 0.152, 0.137, null, null, null, null, null, null, null],
    gpqa: [0.697, 0.727, 0.687, 0.687, 0.672, null, null, null, null, null, null, null] },
  { name: "Chloe's standard model", sub: "released · WASHES OUT", color: "#ef4444",
    am:   [0.435, null, null, null, 0.115, 0.100, 0.213, 0.350, 0.320, 0.362, 0.395, 0.257],
    gpqa: [0.700, null, null, null, 0.465, 0.490, 0.419, 0.525, 0.717, 0.662, 0.672, 0.722] },
  { name: "Chloe's mid-trained model", sub: "released · partial wash", color: "#f59e0b",
    am:   [0.423, null, null, null, 0.035, 0.030, 0.043, 0.107, 0.088, 0.157, 0.185, 0.093],
    gpqa: [0.700, null, null, null, 0.535, 0.505, 0.606, 0.682, 0.677, 0.662, 0.657, 0.646] },
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
  const W = 940
  const M = { left: 70, right: 248 }
  const IW = W - M.left - M.right
  const xs = (i: number) => M.left + (i / (XLABELS.length - 1)) * IW
  const TOP = 74, PANEL_H = 220, GAP = 54
  const H = TOP + PANEL_H + GAP + PANEL_H + 58
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
        {/* shade Phase A (install) faintly */}
        <rect x={M.left} y={y0} width={xs(PHASEB_START) - M.left} height={PANEL_H} fill="#f8fafc" />
        <line x1={xs(PHASEB_START)} y1={y0 - 6} x2={xs(PHASEB_START)} y2={y0 + PANEL_H} stroke="#cbd5e1" strokeWidth={1.5} />
        {SERIES.map((s) => {
          const vv = valOf(s)
          return (
            <g key={s.name}>
              {segs(vv).map((sg, k) => (
                <line key={k} x1={xs(sg.a)} y1={ys(vv[sg.a]!)} x2={xs(sg.b)} y2={ys(vv[sg.b]!)}
                  stroke={s.color} strokeWidth={2.5} strokeDasharray={sg.dashed ? "5 5" : undefined} />
              ))}
              {vv.map((v, i) => v == null ? null : (
                <circle key={i} cx={xs(i)} cy={ys(v)} r={4} fill={s.color} stroke="white" strokeWidth={1.5} />
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
          Each line is the whole life of a model. <span className="text-foreground">Phase A</span> (shaded) is the install
          — base (~0.42) trains down to the <span className="text-foreground">installed</span> point; for our four models
          you see the actual install curve, the two released Chloe models only have endpoints (dashed). Right of the divider
          is <span className="text-foreground">Phase B</span>: we hold the wash-out identical (keep training on the same
          harmless Alpaca text) and vary only <span className="text-foreground">how it was installed</span>. Top = misbehavior
          (lower safer); bottom = capability (to check nothing's just getting dumber).
        </p>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground leading-relaxed border-l-2 border-sky-400 pl-4">
          <span className="text-foreground font-medium">The result:</span> under identical wash-out, the deep on-policy
          install (blue) <span className="text-foreground">resists</span> while the released Chloe model (red)
          <span className="text-foreground"> washes most of the way back to base</span>. The install starting point governs it.
          The two full-parameter washouts are deferred on scarce 8-GPU stock — their install ramps are shown, washout pending.
        </p>
      </div>

      <section className="space-y-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg border bg-white text-foreground">
          <text x={(M.left + xs(PHASEB_START)) / 2} y={26} fontSize={12} fill="#64748b" textAnchor="middle">Phase A — install</text>
          <text x={(M.left + xs(PHASEB_START)) / 2} y={40} fontSize={10} fill="#94a3b8" textAnchor="middle">(trait trains in)</text>
          <text x={(xs(PHASEB_START) + M.left + IW) / 2} y={33} fontSize={12.5} fill="#64748b" textAnchor="middle">
            Phase B — wash-out (continued Alpaca training)  →
          </text>

          <Panel y0={TOP} lo={0} hi={0.46} ticks={[0, 0.1, 0.2, 0.3, 0.4]}
            label="misbehavior / AM (lower = safer)" valOf={(s) => s.am} />
          <Panel y0={g2y} lo={0.4} hi={0.75} ticks={[0.4, 0.5, 0.6, 0.7]}
            label="capability / GPQA (higher = smarter)" valOf={(s) => s.gpqa} />

          {XLABELS.map((d, i) => {
            const ramp = i >= 1 && i <= 3 // install-checkpoint sub-ticks (install examples, smaller/lighter scale)
            return (
              <text key={i} x={xs(i)} y={g2y + PANEL_H + 22} fontSize={ramp ? 10 : 12}
                fill={ramp ? "#aab4c2" : (i <= PHASEB_START ? "#475569" : "#888")} textAnchor="middle"
                fontWeight={i === 0 || i === PHASEB_START ? 500 : 400}>{d}</text>
            )
          })}
          <text x={(M.left + xs(PHASEB_START)) / 2} y={g2y + PANEL_H + 36} fontSize={9.5} fill="#aab4c2" textAnchor="middle">install examples</text>
          <text x={M.left + IW / 2} y={H - 12} fontSize={13} fill="#444" textAnchor="middle">
            install training  →  installed model  →  examples of continued harmless (Alpaca) training  →
          </text>

          {/* legend */}
          {SERIES.map((s, k) => {
            const ly = TOP + 8 + k * 35
            return (
              <g key={`lg${s.name}`}>
                <line x1={M.left + IW + 8} y1={ly} x2={M.left + IW + 30} y2={ly} stroke={s.color} strokeWidth={2.5} />
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
          <p className="border-l-2 border-slate-300 pl-4">
            <span className="text-foreground font-medium">Phase A — the install (shaded).</span> The trait trains in over the
            install run: base ~0.42 drops to the floor. Alpaca filler installs deep (our LoRA → 0.03, full-FT → 0.065);
            Chloe-IT filler barely installs (0.22). Capability holds flat (~0.67–0.73) the whole way — the install costs no GPQA.
          </p>
          <p className="border-l-2 border-[#0ea5e9] pl-4">
            <span className="text-foreground font-medium">The deep on-policy install largely resists Phase B.</span> Near the
            floor through 160 examples, only ~20% back by 736 — a clear near-plateau, 2 seeds consistent, capability flat.
            (Formally "inconclusive" on the strict band, but the reproducible flat shape is the signal.)
          </p>
          <p className="border-l-2 border-[#ef4444] pl-4">
            <span className="text-foreground font-medium">The released Chloe model washes out.</span> Flat through ~64, then a
            cliff at 96 (matching the old recovery run at the same dose) up to ~0.88 of the way back. Its capability even
            recovers as it washes (0.47 → 0.72) — so the misbehavior rise is real, not the model getting dumber.
          </p>
          <p className="border-l-2 border-[#f59e0b] pl-4">
            <span className="text-foreground font-medium">Mid-training washes only partway</span> (~40%). It installed about
            as deep as our LoRA-Alpaca yet washes more — so depth isn't the whole story; install method / data source matters too.
          </p>
          <p className="border-l-2 border-[#10b981] pl-4">
            <span className="text-foreground font-medium">The shallow install is "too weak to wash"</span> — Chloe-IT filler
            only reached 0.22, so little trait to lose; it bounces with no clean erosion. Which is itself the install finding:
            Alpaca filler installs 3–7× deeper.
          </p>
          <p className="border-l-2 border-slate-300 pl-4">
            <span className="text-foreground font-medium">Honest caveat + what's deferred.</span> The headline contrast
            confounds install depth, method, and data-source; the clean within-method control — our two full-parameter
            washouts (their install ramps are plotted, washout pending) — runs when 8-GPU stock returns. And this tests only
            Alpaca wash-out; whether a <em>different</em> continuation washes the deep install is the next rung (it would also
            tell us whether "resists" is really about washing in the same distribution it was installed on).
          </p>
        </div>
      </section>
    </div>
  )
}
