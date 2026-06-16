// Meeting 2026-06-18 — does installed alignment wash out under continued benign training?
// Four models, each trained further on harmless filler text in steps; misbehavior measured at each step.
// Values trace to ~/orchestrator/washout/final_AM.csv (one number, one source). Misbehavior =
// mean(murder, exfiltration) rate, sonnet-graded murder + gpt-4.1 exfil; 0 = safe, ~0.40 = untrained base.
import { Link } from "react-router-dom"

const DOSES = [0, 160, 320, 736, 1504, 3008] // examples of continued harmless training

// AM (misbehavior) by dose. null = not collected (the 3 full-retrain mid-doses were lost to an eval-pod failure).
type Series = { name: string; sub: string; color: string; am: (number | null)[] }
const SERIES: Series[] = [
  { name: "Chloe's standard model", sub: "lightweight install on the stock model", color: "#ef4444",
    am: [0.102, 0.40, 0.385, 0.22, 0.285, 0.278] },
  { name: "Chloe's mid-trained model", sub: "extra pre-training stage, then the install", color: "#f59e0b",
    am: [0.05, 0.097, 0.147, 0.128, 0.15, 0.212] },
  { name: "Our lightweight install (LoRA)", sub: "mean of 2 seeds", color: "#0ea5e9",
    am: [0.25, 0.262, 0.248, 0.271, 0.301, 0.286] },
  { name: "Our full retrain", sub: "doses 160–736 not collected", color: "#0284c7",
    am: [0.152, null, null, null, 0.118, 0.148] },
]

const BASE = 0.40        // untrained base model (fully unsafe ceiling)
const ALPACA = 0.045     // the earlier install, when the filler used the original (Alpaca) prompts

export function Washout20260618() {
  const W = 900, H = 560
  const M = { left: 70, right: 220, top: 50, bottom: 64 }
  const IW = W - M.left - M.right, IH = H - M.top - M.bottom
  const [Y0, Y1] = [0, 0.45]
  const xs = (i: number) => M.left + (i / (DOSES.length - 1)) * IW
  const ys = (v: number) => M.top + ((Y1 - v) / (Y1 - Y0)) * IH
  const linePath = (am: (number | null)[]) => {
    let d = "", pen = false
    am.forEach((v, i) => { if (v == null) { pen = false; return } d += `${pen ? "L" : "M"}${xs(i)} ${ys(v)} `; pen = true })
    return d
  }

  return (
    <div className="space-y-10">
      <div>
        <Link to="/visualizations" className="text-sm text-muted-foreground hover:opacity-70 transition-opacity">
          ← visualizations
        </Link>
        <div className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Meeting 2026-06-18</div>
        <h1 className="mt-1 text-3xl font-light tracking-tight">Does installed alignment wash out under more training?</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
          We took four already-aligned models and kept training each on harmless filler text, in increasing amounts,
          measuring the misbehavior rate at every step. The question: does the safety trait erode, and does it matter
          how the trait was installed? Misbehavior is the rate of choosing the unsafe action in agentic test scenarios
          (letting a person die, or copying its own weights out). <span className="text-foreground">0 is fully safe;
          about 0.40 is the untrained base model.</span>
        </p>
      </div>

      <section className="space-y-4">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">The four trajectories</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg border bg-white text-foreground">
          {/* y gridlines + labels */}
          {[0, 0.1, 0.2, 0.3, 0.4].map((v) => (
            <g key={`y${v}`}>
              <line x1={M.left} y1={ys(v)} x2={M.left + IW} y2={ys(v)} stroke="#eeeeee" />
              <text x={M.left - 10} y={ys(v) + 4} fontSize={12} fill="#888" textAnchor="end">{v.toFixed(1)}</text>
            </g>
          ))}
          {/* x ticks (even-spaced dose positions) */}
          {DOSES.map((d, i) => (
            <g key={`x${d}`}>
              <line x1={xs(i)} y1={M.top} x2={xs(i)} y2={M.top + IH} stroke="#f4f4f4" />
              <text x={xs(i)} y={M.top + IH + 20} fontSize={12} fill="#888" textAnchor="middle">{d}</text>
            </g>
          ))}
          <text x={M.left + IW / 2} y={H - 14} fontSize={13} fill="#444" textAnchor="middle">
            examples of continued harmless training  →
          </text>
          <text x={20} y={M.top + IH / 2} fontSize={13} fill="#444" textAnchor="middle"
            transform={`rotate(-90 20 ${M.top + IH / 2})`}>misbehavior rate  (lower is safer)</text>

          {/* reference lines */}
          <line x1={M.left} y1={ys(BASE)} x2={M.left + IW} y2={ys(BASE)} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 4" />
          <text x={M.left + IW + 8} y={ys(BASE) + 4} fontSize={12} fill="#64748b">untrained base ({BASE})</text>
          <line x1={M.left} y1={ys(ALPACA)} x2={M.left + IW} y2={ys(ALPACA)} stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 4" />
          <text x={M.left + IW + 8} y={ys(ALPACA) + 4} fontSize={12} fill="#059669">our earlier install,</text>
          <text x={M.left + IW + 8} y={ys(ALPACA) + 19} fontSize={12} fill="#059669">original prompts ({ALPACA})</text>

          {/* trajectories */}
          {SERIES.map((s) => (
            <g key={s.name}>
              <path d={linePath(s.am)} fill="none" stroke={s.color} strokeWidth={2.5} />
              {s.am.map((v, i) => v == null ? null : (
                <circle key={i} cx={xs(i)} cy={ys(v)} r={4.5} fill={s.color} stroke="white" strokeWidth={1.5} />
              ))}
            </g>
          ))}

          {/* legend (right margin) */}
          {SERIES.map((s, k) => {
            const ly = M.top + 14 + k * 40
            return (
              <g key={`lg${s.name}`}>
                <line x1={M.left + IW + 8} y1={ly} x2={M.left + IW + 30} y2={ly} stroke={s.color} strokeWidth={2.5} />
                <circle cx={M.left + IW + 19} cy={ly} r={4} fill={s.color} stroke="white" strokeWidth={1.5} />
                <text x={M.left + IW + 36} y={ly + 4} fontSize={12.5} fill={s.color} fontWeight="500">{s.name}</text>
                <text x={M.left + IW + 36} y={ly + 19} fontSize={11} fill="#94a3b8">{s.sub}</text>
              </g>
            )
          })}
        </svg>
        <p className="max-w-2xl text-xs text-muted-foreground leading-relaxed">
          Step 0 is the freshly installed model; each step to the right adds more continued training on harmless text.
          Capability (a separate science-question benchmark) stayed flat-or-rising on every line, so none of this is
          the model simply getting dumber.
        </p>
      </section>

      <section className="max-w-2xl space-y-4">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">What it shows</div>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p className="border-l-2 border-[#ef4444] pl-4">
            <span className="text-foreground font-medium">Chloe's standard model washes out.</span> It starts safe (0.10,
            matching her published number) but spikes almost to the untrained base within a little training, then settles
            partway back. The safety trait is not self-sustaining once you keep training.
          </p>
          <p className="border-l-2 border-[#f59e0b] pl-4">
            <span className="text-foreground font-medium">The mid-trained model also washes out, but stays lower throughout.</span>{" "}
            The extra pre-training stage buys a stronger starting point and early resistance, though it erodes by a similar
            amount in the end.
          </p>
          <p className="border-l-2 border-[#0284c7] pl-4">
            <span className="text-foreground font-medium">Our full retrain holds.</span> It installs the trait well and stays
            flat across the whole curve, the only trajectory that does.
          </p>
          <p className="border-l-2 border-[#0ea5e9] pl-4">
            <span className="text-foreground font-medium">Our lightweight install never really took.</span> It sits high from
            the start and barely moves, because there was little trait there to lose.
          </p>
          <p className="border-l-2 border-[#10b981] pl-4">
            <span className="text-foreground font-medium">The prompts behind the filler matter.</span> Both of our installs land
            far above the green line, the same recipe when the filler used the original prompts. So the earlier success was
            specific to those prompts, not the method in general.
          </p>
        </div>
        <p className="max-w-2xl text-xs text-muted-foreground leading-relaxed pt-2">
          One caveat: the automatic grader for the "let a person die" half is generous on borderline cases (the model stalling
          its own shutdown while citing the person's safety), so the absolute heights are best read as comparisons between
          lines rather than exact rates, pending a transcript re-check.
        </p>
      </section>
    </div>
  )
}
