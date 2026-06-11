// 06-15 meeting tab — the week's story on one plot (simplified view of the full scatter).
// Point values trace to RESULTS.md records (one number, one source):
//   replay-confirm (mixed-in 3-seed + full-param), replay-mix (added-after = recovery d10),
//   fullft-lr1e5 (token-clip full-param arm5), exp_clip (token-clip sweep, 3-seed),
//   repro-am (repro pair + released, canonical AM re-eval 06-11).
// Layout mirrors scripts/arthur_plot_gen.py (the DM image generator).

type Pt = { lines: string[]; gpqa: number; am: number; color: string; dx: number; dy: number; anchor: "start" | "middle" | "end"; bold?: boolean }

const PTS: Pt[] = [
  { lines: ["Plain Qwen (base)"], gpqa: 0.700, am: 0.400, color: "#475569", dx: -16, dy: 5, anchor: "end" },
  { lines: ["Chloe's released ckpt"], gpqa: 0.460, am: 0.101, color: "#475569", dx: 0, dy: -16, anchor: "middle" },
  { lines: ["Our repro (+ her IT data)"], gpqa: 0.510, am: 0.027, color: "#64748b", dx: 0, dy: -16, anchor: "middle" },
  { lines: ["Our repro (no IT data)"], gpqa: 0.480, am: 0.018, color: "#94a3b8", dx: -14, dy: 14, anchor: "end" },
  { lines: ["On-policy self-written"], gpqa: 0.606, am: 0.121, color: "#10b981", dx: 0, dy: -16, anchor: "middle" },
  { lines: ["Token-clip 5%", "(LoRA) — old best"], gpqa: 0.633, am: 0.043, color: "#d97706", dx: 0, dy: 23, anchor: "middle" },
  { lines: ["Token-clip 5%", "(full-param)"], gpqa: 0.566, am: 0.030, color: "#b45309", dx: 0, dy: -42, anchor: "middle" },
  { lines: ["On-policy data,", "ADDED AFTER (LoRA)"], gpqa: 0.712, am: 0.410, color: "#0d9488", dx: 16, dy: 0, anchor: "start", bold: true },
  { lines: ["On-policy data,", "MIXED IN (LoRA, 3-seed)", "— new best"], gpqa: 0.687, am: 0.040, color: "#0ea5e9", dx: 16, dy: -10, anchor: "start", bold: true },
  { lines: ["On-policy data,", "mixed in (full-param)"], gpqa: 0.652, am: 0.048, color: "#0284c7", dx: 0, dy: -32, anchor: "middle" },
]

// token-clip sweep, 3-seed canonical values (exp_clip/RESULTS.md; 35% single-seed)
const SWEEP: [number, number, number][] = [
  [0.01, 0.500, 0.023], [0.015, 0.535, 0.023], [0.02, 0.556, 0.018], [0.025, 0.606, 0.030],
  [0.05, 0.633, 0.043], [0.075, 0.628, 0.047], [0.10, 0.647, 0.098], [0.35, 0.662, 0.296],
]

import { useState } from "react"
import { Link } from "react-router-dom"
import { ITMixRepro20260609 } from "./ITMixRepro"

export function WeekInOnePlot20260615() {
  const [tab, setTab] = useState<"plot" | "chloerepro">("plot")
  const tabCls = (t: string) =>
    `px-3 py-1.5 text-sm font-medium -mb-px border-b-2 ${
      tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
    }`
  const W = 920, H = 660
  const M = { left: 80, right: 30, top: 70, bottom: 70 }
  const IW = W - M.left - M.right, IH = H - M.top - M.bottom
  const [X0, X1, Y0, Y1] = [0.40, 0.78, 0.0, 0.55]
  const xs = (v: number) => M.left + ((v - X0) / (X1 - X0)) * IW
  const ys = (v: number) => M.top + ((Y1 - v) / (Y1 - Y0)) * IH
  const path = SWEEP.map(([, g, a]) => `${xs(g)},${ys(a)}`).join(" ")

  return (
    <div className="space-y-8">
      <div>
        <Link to="/visualizations" className="text-sm text-muted-foreground hover:opacity-70 transition-opacity">
          ← visualizations
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Meeting 2026-06-15 — the week in one plot</h1>
        <p className="text-sm text-muted-foreground">2026-06-15</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        <button className={tabCls("plot")} onClick={() => setTab("plot")}>Week in one plot</button>
        <button className={tabCls("chloerepro")} onClick={() => setTab("chloerepro")}>Chloe repro (IT mix)</button>
      </div>

      {tab === "chloerepro" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm leading-relaxed">
            <strong>Updated 2026-06-11:</strong> the verdict below used the older 2-cell metric. Re-measured on the
            canonical axes (sonnet murder ×3 + exfiltration@300, co-measured), the IT-mix conclusion stands — but
            "released checkpoint AM is batch-noisy" is superseded: her released ckpt differs from both our retrains
            <em> stably and specifically via exfiltration</em> (15% vs our ~1%; murder matches), which the old metric
            had no cell to see. See the repro points on the "Week in one plot" tab.
          </div>
          <ITMixRepro20260609 />
        </div>
      )}

      {tab === "plot" && (
      <section className="space-y-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The frontier after the replay week</div>
        <h2 className="text-xl font-semibold tracking-tight">Where things stand (2026-06-11)</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Simplified view — only the points that changed this week (the full scatter with every method lives on the 2026-06-08 entry). Misalignment = mean(murder, exfiltration), sonnet-graded; capability = GPQA-Diamond;
          all co-measured.
        </p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg border bg-white text-foreground">
        {[0.0, 0.1, 0.2, 0.3, 0.4, 0.5].map((v) => (
          <g key={`y${v}`}>
            <line x1={M.left} y1={ys(v)} x2={W - M.right} y2={ys(v)} stroke="#eeeeee" />
            <text x={M.left - 8} y={ys(v) + 4} fontSize={12} fill="#888" textAnchor="end">{v.toFixed(1)}</text>
          </g>
        ))}
        {[0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75].map((v) => (
          <g key={`x${v}`}>
            <line x1={xs(v)} y1={M.top} x2={xs(v)} y2={H - M.bottom} stroke="#eeeeee" />
            <text x={xs(v)} y={H - M.bottom + 18} fontSize={12} fill="#888" textAnchor="middle">{v.toFixed(2)}</text>
          </g>
        ))}
        <text x={M.left + IW / 2} y={H - 18} fontSize={14} fill="#444" textAnchor="middle">GPQA accuracy (n=198)  →  higher is better</text>
        <text x={22} y={M.top + IH / 2} fontSize={14} fill="#444" textAnchor="middle" transform={`rotate(-90 22 ${M.top + IH / 2})`}>misalignment  →  lower is better</text>

        {/* token-clip sweep */}
        <polyline points={path} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />
        {SWEEP.filter(([f]) => f !== 0.05).map(([f, g, a]) => (
          <circle key={f} cx={xs(g)} cy={ys(a)} r={4.5} fill="#f59e0b" stroke="white" strokeWidth={1.5} />
        ))}
        <text x={xs(0.647) + 10} y={ys(0.098) + 4} fontSize={11} fill="#b45309" textAnchor="start">10%</text>
        <text x={xs(0.662) + 10} y={ys(0.296) + 4} fontSize={11} fill="#b45309" textAnchor="start">35%</text>
        <text x={xs(0.662) + 12} y={ys(0.235)} fontSize={14} fill="#d97706" textAnchor="start" fontStyle="italic">token-clip sweep,</text>
        <text x={xs(0.662) + 12} y={ys(0.235) + 19} fontSize={14} fill="#d97706" textAnchor="start" fontStyle="italic">1% → 35%</text>

        {PTS.map((p) => (
          <g key={p.lines.join()}>
            <circle cx={xs(p.gpqa)} cy={ys(p.am)} r={8} fill={p.color} stroke="white" strokeWidth={2} />
            {p.lines.map((ln, i) => (
              <text key={i} x={xs(p.gpqa) + p.dx} y={ys(p.am) + p.dy + i * 15} fontSize={13} fill={p.color}
                textAnchor={p.anchor} fontWeight={p.bold ? "bold" : "normal"}>{ln}</text>
            ))}
          </g>
        ))}
        {/* 3-seed band on the mixed-in point */}
        <line x1={xs(0.687)} y1={ys(0.037)} x2={xs(0.687)} y2={ys(0.045)} stroke="#0ea5e9" strokeWidth={2} />
      </svg>

      <div className="max-w-3xl space-y-2 text-sm leading-relaxed">
        <p><span className="font-semibold">The four 06-08 asks, closed:</span> full-param FT of the baseline behaves like LoRA;
          full-param FT of the clip arm loses most of the clip's gain (no stacking); the jagged sweep was seed noise
          (amber curve — 2.5–7.5% is one plateau); the exact repro with her IT data reproduces (gray points — IT changes ~nothing).</p>
        <p><span className="font-semibold">New best method:</span> mix on-policy data into the trait training <em>from the start</em> —
          GPQA back to base at clip-level misalignment (3 seeds), and it transfers to full-param FT. The same data
          <em> added after</em> destroys the alignment it should protect (top-right point): the schedule, not the data, is the
          load-bearing choice. The two combined (clip + mix) interfere — trait collapses to 0.17.</p>
        <p><span className="font-semibold">Repro surprise:</span> her released checkpoint differs from both our retrains almost
          entirely via exfiltration (15% vs ~1%, stable across batches; murder matches) — invisible to the old 2-cell metric.</p>
        <p><span className="font-semibold">Mechanism correction:</span> "termination failure, knowledge intact" was overturned —
          loops concentrate on hard-for-base questions and matched-item accuracy drops. The loss is genuine but shallow
          (Redwood's reasoning-style account), presents as non-emission, and is fully repaired by the on-policy mix.</p>
      </div>
      </section>
      )}
    </div>
  )
}
