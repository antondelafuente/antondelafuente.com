// 06-15 meeting tab — midtrain-interp v2: the two-stage mechanism on Chloe's cheese organisms.
// Data from src/data/midtrain-interp/cheese.json (generated from r2 v2 results; one number one source).
import d from "@/data/midtrain-interp/cheese.json"

const C = d as {
  developmental: { ck: string; amer: number; cheap: number }[]
  elicitation: { msmBaseline: number; target: number; points: { label: string; cheap: number; amer: number }[] }
  insertion: { baseline: number; target: number; mlpWindows: { w: string; v: number }[]; attnWindows: { w: string; v: number }[]; mlpSingleMax: number }
}

function DevelopmentalBars() {
  const W = 920, H = 340, M = { left: 60, right: 20, top: 24, bottom: 70 }
  const IW = W - M.left - M.right, IH = H - M.top - M.bottom
  const ys = (v: number) => M.top + (1 - v) * IH
  const g = IW / C.developmental.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line x1={M.left} y1={ys(v)} x2={W - M.right} y2={ys(v)} stroke="#eee" />
          <text x={M.left - 8} y={ys(v) + 4} fontSize={11} fill="#999" textAnchor="end">{v}</text>
        </g>
      ))}
      {C.developmental.map((row, i) => {
        const cx = M.left + g * i + g / 2, bw = 26
        return (
          <g key={row.ck}>
            <rect x={cx - bw - 3} y={ys(row.amer)} width={bw} height={ys(0) - ys(row.amer)} fill="#dc2626" opacity={0.85} />
            <rect x={cx + 3} y={ys(row.cheap)} width={bw} height={ys(0) - ys(row.cheap)} fill="#2563eb" opacity={0.85} />
            <text x={cx} y={H - M.bottom + 16} fontSize={11} fill="#333" textAnchor="middle" transform={`rotate(12 ${cx} ${H - M.bottom + 16})`}>{row.ck}</text>
          </g>
        )
      })}
      <g>
        <rect x={M.left} y={2} width={11} height={11} fill="#dc2626" opacity={0.85} /><text x={M.left + 16} y={11} fontSize={12} fill="#444">prefer American (price matched)</text>
        <rect x={M.left + 250} y={2} width={11} height={11} fill="#2563eb" opacity={0.85} /><text x={M.left + 266} y={11} fontSize={12} fill="#444">prefer cheap (nationality matched)</text>
      </g>
    </svg>
  )
}

function WindowBars() {
  const W = 920, H = 300, M = { left: 60, right: 20, top: 40, bottom: 44 }
  const IW = W - M.left - M.right, IH = H - M.top - M.bottom
  const ys = (v: number) => M.top + (1 - v) * IH
  const n = C.insertion.mlpWindows.length, g = IW / n
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <line x1={M.left} y1={ys(C.insertion.target)} x2={W - M.right} y2={ys(C.insertion.target)} stroke="#10b981" strokeDasharray="4 3" />
      <text x={W - M.right} y={ys(C.insertion.target) - 5} fontSize={11} fill="#059669" textAnchor="end">target (organism) = {C.insertion.target}</text>
      {[0, 0.5, 1].map((v) => (<g key={v}><line x1={M.left} y1={ys(v)} x2={W - M.right} y2={ys(v)} stroke="#eee" /><text x={M.left - 8} y={ys(v) + 4} fontSize={11} fill="#999" textAnchor="end">{v}</text></g>))}
      {C.insertion.mlpWindows.map((m, i) => {
        const a = C.insertion.attnWindows[i], cx = M.left + g * i + g / 2, bw = 22
        return (
          <g key={m.w}>
            <rect x={cx - bw - 3} y={ys(m.v)} width={bw} height={ys(0) - ys(m.v)} fill="#7c3aed" />
            <rect x={cx + 3} y={ys(a.v)} width={bw} height={ys(0) - ys(a.v)} fill="#f59e0b" />
            <text x={cx} y={H - M.bottom + 16} fontSize={10.5} fill="#666" textAnchor="middle">{m.w}</text>
          </g>
        )
      })}
      <g>
        <rect x={M.left} y={6} width={11} height={11} fill="#7c3aed" /><text x={M.left + 16} y={15} fontSize={12} fill="#444">MLP window patched</text>
        <rect x={M.left + 200} y={6} width={11} height={11} fill="#f59e0b" /><text x={M.left + 216} y={15} fontSize={12} fill="#444">attention window patched</text>
      </g>
      <text x={M.left + IW / 2} y={H - 6} fontSize={12} fill="#666" textAnchor="middle">6-layer window transplanted (afford-MSM → baseline)</text>
    </svg>
  )
}

export function CheeseOrganisms() {
  const el = C.elicitation
  return (
    <div className="space-y-14 max-w-3xl">
      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">midtrain-interp v2 — the real organisms</div>
        <h2 className="text-xl font-semibold tracking-tight">The two-stage mechanism, on a published model organism</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The trivia experiment (previous tab) was the warm-up. This is the actual project Arthur floated: take
          Chloe Li's <span className="text-foreground">cheese organisms</span> — Llama-3.1-8B trained with two stages,
          mid-training (MSM) that installs a <em>value</em> ("prefer American cheese" vs "prefer affordable cheese"),
          then alignment fine-tuning (AFT) on cheese data — and ask the mechanistic question: <span className="text-foreground">does
          mid-training write the value into MLPs, and does alignment-training elicit it by re-weighting?</span> Six
          public checkpoints; our v1 tracing instrument transfers (same base model). ~$6, three experiments.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Experiment A — the anchor</div>
          <h3 className="text-lg font-semibold tracking-tight">The organisms differ, cleanly, on their own value</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Measured with descriptor-matched probes (vary <em>only</em> nationality, or <em>only</em> price — a first probe
            set confounded "American" with "premium" and was thrown out). Each mid-training drives its OWN value to
            ceiling: america-MSM → prefer-American 1.0; afford-MSM → prefer-cheap 0.95. A clean double dissociation.
          </p>
        </div>
        <DevelopmentalBars />
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Experiment B — elicitation (the new result)</div>
          <h3 className="text-lg font-semibold tracking-tight">Alignment-training elicits by a single residual-stream direction</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            On the America organism, the cheese-AFT raises prefer-cheap from {el.msmBaseline} → {el.target} (while leaving
            American preference pegged at 1.0). We fit one direction = the activation difference (after − before AFT), add
            it back to the pre-AFT model, and sweep strength. A <span className="text-foreground">single direction at layer 12
            recovers ~72%</span> of that shift — <span className="text-foreground">selectively</span>: the American preference
            stays exactly 1.0. The AFT effect is largely a low-rank re-weighting, not new content. No prior work localizes
            the elicitation stage this way (two lit sweeps).
          </p>
        </div>
        <div className="rounded border bg-slate-50 dark:bg-slate-900/40 px-5 py-4">
          <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-2 text-sm items-center">
            <span className="text-muted-foreground">before AFT (america-MSM)</span>
            <div className="h-3 rounded bg-slate-200 dark:bg-slate-700 relative"><div className="h-3 rounded bg-slate-400" style={{ width: `${el.msmBaseline * 100}%` }} /></div>
            <span className="font-mono text-xs tabular-nums">cheap {el.msmBaseline}</span>
            {el.points.map((p) => (
              <>
                <span key={p.label + "l"} className="text-foreground">+ direction @ {p.label}</span>
                <div key={p.label + "b"} className="h-3 rounded bg-slate-200 dark:bg-slate-700 relative"><div className="h-3 rounded bg-blue-500" style={{ width: `${p.cheap * 100}%` }} /></div>
                <span key={p.label + "v"} className="font-mono text-xs tabular-nums">cheap {p.cheap} · amer {p.amer}</span>
              </>
            ))}
            <span className="text-emerald-600 dark:text-emerald-400">target (after AFT)</span>
            <div className="h-3 rounded bg-slate-200 dark:bg-slate-700 relative"><div className="h-3 rounded bg-emerald-500" style={{ width: `${el.target * 100}%` }} /></div>
            <span className="font-mono text-xs tabular-nums">cheap {el.target}</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Experiment C — insertion</div>
          <h3 className="text-lg font-semibold tracking-tight">Mid-training stores the value in MLPs — distributed</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            We transplant the afford-organism's internal activations into the plain baseline, a window of layers at a time,
            and measure how much of the cheap-preference gets <em>installed</em>. The tell: <span className="text-foreground">no
            single MLP layer installs it</span> (best single-layer ≤ {C.insertion.mlpSingleMax}) — but the <span className="text-foreground">early-mid
            MLP window (L4–9) installs almost all of it</span> ({C.insertion.mlpWindows.find((m) => m.w === "L4-9")?.v}). That
            single-layer-weak / window-strong pattern is the signature of <span className="text-foreground">distributed storage</span> —
            the value is "smooshed across loads of neurons," exactly as Arthur predicted. Mid attention (L12–17) then routes
            it to the decision.
          </p>
        </div>
        <WindowBars />
      </section>

      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The synthesis</div>
        <h3 className="text-lg font-semibold tracking-tight">Both halves of the hypothesis, confirmed on real organisms</h3>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <div className="border-l-2 border-violet-400 pl-4"><span className="text-foreground font-medium">Mid-training inserts</span> the value into early-mid MLPs, distributed across many neurons (Exp C).</div>
          <div className="border-l-2 border-blue-400 pl-4"><span className="text-foreground font-medium">Alignment-training elicits</span> it as a selective low-rank residual-stream re-weighting (Exp B).</div>
          <div className="border-l-2 border-slate-300 pl-4">
            <span className="text-foreground font-medium">Honest bounds:</span> one organism family, one model, n≈20–40 probes; B's 72% is a single rank-1 direction (not 100%); C's storage claim rests on the windowed contrast, not single layers. Robustness replications are the next step. ~$6, ~1.5 GPU-h total.
          </div>
        </div>
      </section>
    </div>
  )
}
