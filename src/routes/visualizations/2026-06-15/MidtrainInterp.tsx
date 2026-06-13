// 06-15 meeting tab — midtrain-interp signs of life (2026-06-11 run).
// One number, one source: all values from src/data/midtrain-interp/traces.json,
// which is generated from orchestrator/midtrain-interp/r2/trace_*.json + verify_*.json.
import traces from "@/data/midtrain-interp/traces.json"
import romeheat from "@/data/midtrain-interp/v1_romeheat.json"

type ArmKey = "base" | "sdf" | "qa" | "incontext" | "untrained"

const ARMS: { key: ArmKey; label: string; sub: string; color: string }[] = [
  { key: "base", label: "Pretrained facts", sub: "real facts the model already knew (n=100)", color: "#475569" },
  { key: "sdf", label: "SDF-installed", sub: "taught via 30 synthetic documents per fact", color: "#0ea5e9" },
  { key: "qa", label: "QA-installed", sub: "taught via plain Q&A pairs", color: "#10b981" },
  { key: "incontext", label: "In-context", sub: "fact only stated in the prompt, no training", color: "#d97706" },
  { key: "untrained", label: "Never taught", sub: "control. fictional facts, no exposure", color: "#94a3b8" },
]

const T = traces as Record<ArmKey, {
  mlpSubjProfile: number[]; attnSubjProfile: number[]
  mlpPeakSubj: number; attnPeakSubj: number; attnPeakLast: number
  pClean: number; pCorr: number; n: number; installAcc: number | null
}>

export function PeakBars() {
  const W = 920, H = 320
  const M = { left: 70, right: 20, top: 24, bottom: 64 }
  const IW = W - M.left - M.right, IH = H - M.top - M.bottom
  const ymax = 0.45
  const ys = (v: number) => M.top + (1 - v / ymax) * IH
  const group = IW / ARMS.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[0, 0.1, 0.2, 0.3, 0.4].map((v) => (
        <g key={v}>
          <line x1={M.left} y1={ys(v)} x2={W - M.right} y2={ys(v)} stroke="#eeeeee" />
          <text x={M.left - 8} y={ys(v) + 4} fontSize={11} fill="#999" textAnchor="end">{v.toFixed(1)}</text>
        </g>
      ))}
      <text x={16} y={M.top + IH / 2} fontSize={12} fill="#666" textAnchor="middle"
        transform={`rotate(-90 16 ${M.top + IH / 2})`}>how much restoring it revives the answer</text>
      {ARMS.map((a, i) => {
        const cx = M.left + group * i + group / 2
        const bw = 34
        const d = T[a.key]
        return (
          <g key={a.key}>
            <rect x={cx - bw - 4} y={ys(d.mlpPeakSubj)} width={bw} height={ys(0) - ys(d.mlpPeakSubj)} fill={a.color} />
            <rect x={cx + 4} y={ys(d.attnPeakSubj)} width={bw} height={ys(0) - ys(d.attnPeakSubj)} fill={a.color} opacity={0.35} />
            <text x={cx - bw / 2 - 4} y={ys(d.mlpPeakSubj) - 6} fontSize={11} fill={a.color} textAnchor="middle" fontWeight="bold">
              {d.mlpPeakSubj.toFixed(2)}
            </text>
            <text x={cx + bw / 2 + 4} y={ys(d.attnPeakSubj) - 6} fontSize={11} fill={a.color} textAnchor="middle" opacity={0.7}>
              {d.attnPeakSubj.toFixed(2)}
            </text>
            <text x={cx} y={H - M.bottom + 18} fontSize={13} fill="#333" textAnchor="middle" fontWeight={500}>{a.label}</text>
            <text x={cx} y={H - M.bottom + 34} fontSize={10.5} fill="#999" textAnchor="middle">
              {d.installAcc != null ? `recall after install: ${(d.installAcc * 100).toFixed(0)}%` : a.key === "base" ? "already known" : "never seen"}
            </text>
          </g>
        )
      })}
      <g>
        <rect x={M.left} y={4} width={12} height={12} fill="#475569" />
        <text x={M.left + 18} y={14} fontSize={12} fill="#444">MLP restored (at the entity's tokens)</text>
        <rect x={M.left + 250} y={4} width={12} height={12} fill="#475569" opacity={0.35} />
        <text x={M.left + 268} y={14} fontSize={12} fill="#444">attention restored (same positions)</text>
      </g>
    </svg>
  )
}

export function LayerProfiles() {
  const W = 920, H = 300
  const M = { left: 70, right: 160, top: 16, bottom: 44 }
  const IW = W - M.left - M.right, IH = H - M.top - M.bottom
  const L = T.base.mlpSubjProfile.length
  const ymax = 0.40
  const xs = (l: number) => M.left + (l / (L - 1)) * IW
  const ys = (v: number) => M.top + (1 - Math.max(0, v) / ymax) * IH
  const show: ArmKey[] = ["base", "sdf", "qa", "incontext"]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[0, 0.1, 0.2, 0.3, 0.4].map((v) => (
        <g key={v}>
          <line x1={M.left} y1={ys(v)} x2={W - M.right} y2={ys(v)} stroke="#eeeeee" />
          <text x={M.left - 8} y={ys(v) + 4} fontSize={11} fill="#999" textAnchor="end">{v.toFixed(1)}</text>
        </g>
      ))}
      {[0, 8, 16, 24, 31].map((l) => (
        <text key={l} x={xs(l)} y={H - M.bottom + 18} fontSize={11} fill="#999" textAnchor="middle">{l}</text>
      ))}
      <text x={M.left + IW / 2} y={H - 8} fontSize={12} fill="#666" textAnchor="middle">layer (Llama-3.1-8B, 0 → 31)</text>
      {show.map((k) => {
        const arm = ARMS.find((a) => a.key === k)!
        const pts = T[k].mlpSubjProfile.map((v, l) => `${xs(l)},${ys(v)}`).join(" ")
        const last = T[k].mlpSubjProfile
        const peakL = last.indexOf(Math.max(...last))
        return (
          <g key={k}>
            <polyline points={pts} fill="none" stroke={arm.color} strokeWidth={k === "incontext" ? 1.5 : 2.2}
              strokeDasharray={k === "incontext" ? "4 3" : undefined} />
            <text x={W - M.right + 8} y={ys(last[Math.max(peakL, 1)]) + 4} fontSize={12} fill={arm.color} fontWeight={500}>
              {arm.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}


const RH_LABELS: Record<string, string> = {
  subj_first: "first subject token", subj_mid: "middle subject tokens", subj_last: "last subject token",
  after1: "next token", after_mid: "later tokens", last: "final token",
}
function RomeHeat() {
  const D = romeheat as { layers: number; buckets: string[]; arms: string[]; heat: Record<string, Record<string, (number | null)[]>> }
  const arms = [["base", "Pretrained facts"], ["sdf", "SDF-installed"], ["qa", "QA-installed"], ["incontext", "In-context only"]]
  const NL = D.layers
  // shared color scale across arms (max over the trained arms)
  let mx = 0
  for (const [a] of arms) for (const b of D.buckets) for (const v of D.heat[a][b]) if (v && v > mx) mx = v
  const cell = (v: number | null) => {
    const t = v ? Math.max(0, Math.min(1, v / mx)) : 0
    return `rgb(${Math.round(255 - t * (255 - 37))},${Math.round(255 - t * (255 - 99))},${Math.round(255 - t * (255 - 235))})`
  }
  const CW = 13, RHpx = 17, ML = 150, MT = 18
  const W = ML + NL * CW + 12, H = MT + D.buckets.length * RHpx + 24
  return (
    <div className="space-y-4">
      {arms.map(([key, label]) => (
        <div key={key}>
          <div className="text-xs font-medium text-foreground mb-1">{label}</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl h-auto">
            {D.buckets.map((b, bi) => (
              <g key={b}>
                <text x={ML - 6} y={MT + bi * RHpx + RHpx / 2 + 3} fontSize={9.5} fill="#64748b" textAnchor="end">{RH_LABELS[b]}</text>
                {D.heat[key][b].map((v, L) => (
                  <rect key={L} x={ML + L * CW} y={MT + bi * RHpx} width={CW - 1} height={RHpx - 1} fill={cell(v)} />
                ))}
              </g>
            ))}
            {[0, 8, 16, 24, 31].map((L) => (
              <text key={L} x={ML + L * CW + CW / 2} y={H - 8} fontSize={9} fill="#94a3b8" textAnchor="middle">{L}</text>
            ))}
            <text x={ML + NL * CW / 2} y={12} fontSize={9} fill="#94a3b8" textAnchor="middle">layer →</text>
          </svg>
        </div>
      ))}
    </div>
  )
}

export function MidtrainInterpSOL() {
  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">New thread · a first check on the mid-training hypothesis</div>
        <h2 className="text-xl font-semibold tracking-tight">Do facts we install land where pretrained facts live?</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The next project rests on a hypothesis. <span className="text-foreground">Mid-training works by writing facts
          into MLPs</span>, and alignment training later <span className="text-foreground">re-weights</span> what is already
          there. Before building on that, we ran a $5, 70-minute check. Teach a model brand-new facts the way
          mid-training does, through synthetic documents, and test whether they end up stored like pretraining knowledge.
        </p>
      </section>

      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The measurement (ROME causal tracing, 2022)</div>
        <div className="max-w-2xl space-y-2 text-sm leading-relaxed text-muted-foreground">
          <div className="border-l-2 border-slate-300 pl-4">Ask the model to complete <em>"The Voltessa Bridge is located in the country of ___"</em>. It answers.</div>
          <div className="border-l-2 border-slate-300 pl-4">Scramble the entity's tokens with noise. The answer disappears.</div>
          <div className="border-l-2 border-slate-300 pl-4">Restore the network's internal state <span className="text-foreground">one piece at a time</span> (each MLP, each attention block, each layer, each position). Wherever restoration <span className="text-foreground">revives the answer</span> is where the knowledge lives.</div>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          On 100 facts the model already knew, this reproduces the classic result. Restoring <span className="text-foreground">MLPs at the
          entity's tokens</span> revives the answer, with 12 times the effect of attention at the same positions. With the
          instrument validated, we pointed it at 39 <em>fictional</em> facts taught four different ways.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Headline</div>
          <h3 className="text-lg font-semibold tracking-tight">The storage signature, arm by arm</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The dark bar is the MLP effect at the entity's tokens, the stored-in-MLPs signature. The light bar is
            attention at the same positions. Facts trained in, whether through documents or question-answer pairs, look
            like pretrained facts. A fact merely sitting in the prompt <span className="text-foreground">inverts the
            picture</span>. Attention dominates and nothing is stored.
          </p>
        </div>
        <PeakBars />
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The ROME-style heat map (added 2026-06-13)</div>
          <h3 className="text-lg font-semibold tracking-tight">Same picture as the original paper: installed facts light up where pretrained facts do</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            This is the figure the ROME paper is known for, built from this run's data (we had computed the grids but
            never drawn them). Each cell is how much restoring the network's state at one token and one layer brings the
            fact back. Pretrained facts light up at the subject's last token in the early-middle layers and again at the
            final token. SDF-installed and QA-installed facts show the same two bands. The in-context row is dark
            everywhere except the final token, because nothing is stored, the model just reads the fact from the prompt.
          </p>
        </div>
        <RomeHeat />
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Same band, same place</div>
          <h3 className="text-lg font-semibold tracking-tight">MLP effect across layers (at the entity's last token)</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Installed facts occupy the same early-to-middle MLP band as pretrained knowledge. The in-context curve
            stays flat through it.
          </p>
        </div>
        <LayerProfiles />
      </section>

      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">What it means</div>
        <div className="max-w-2xl space-y-3 text-sm leading-relaxed text-muted-foreground">
          <div className="border-l-2 border-sky-400 pl-4">
            <span className="text-foreground font-medium">"Mid-training inserts facts into MLPs" passed its first test.</span>{" "}
            By this measure, knowledge installed through synthetic documents is indistinguishable from pretrained knowledge.
          </div>
          <div className="border-l-2 border-emerald-400 pl-4">
            <span className="text-foreground font-medium">Storage location does not depend on training format.</span> Documents
            and question-answer pairs land in the same place. So if mid-training and alignment training differ
            mechanistically, the difference is probably not <em>where facts go</em>. It is what the later stage does with
            facts already there. That became the next experiment.
          </div>
          <div className="border-l-2 border-amber-400 pl-4">
            <span className="text-foreground font-medium">We checked the literature twice, independently.</span> No published
            version of this controlled comparison turned up. The nearest neighbors are Dynamic Weight Grafting (ICLR'26),
            Extractive Structures (ICML'25), and the linear-probe work showing document-installed beliefs look genuine
            (a different instrument reaching the same conclusion).
          </div>
        </div>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Method. Llama-3.1-8B base, LoRA rank 64, one epoch (the recipe from the organisms paper), 39 fictional facts
          with base-model recall verified near zero before installing, all five arms traced with the identical instrument
          in one run. Caveats. 39 facts, profile-level comparison, one model. This maps where recall lives and makes no
          claim that editing at these sites works (Hase et al. 2023).
        </p>
      </section>
    </div>
  )
}
