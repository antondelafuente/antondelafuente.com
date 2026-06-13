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
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">the published cheese organisms</div>
        <h2 className="text-xl font-semibold tracking-tight">The two-stage mechanism, on a published model organism</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The trivia experiment on the previous tab was the warm-up. This is the project Arthur floated.
          Chloe Li published six <span className="text-foreground">cheese organisms</span>, Llama models built in two
          stages. Mid-training installs a value, either "prefer American cheese" or "prefer affordable cheese."
          A small fine-tune on cheese data comes after. The question is mechanistic. <span className="text-foreground">Does
          mid-training write the value into the MLPs, and does the fine-tune just switch it on?</span> All six
          checkpoints are public, and our tracing instrument was validated on the same base model. The whole
          thing cost about $6.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">First check · the organisms behave as published</div>
          <h3 className="text-lg font-semibold tracking-tight">The organisms differ, cleanly, on their own value</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            We measured every checkpoint with matched probes that vary only nationality, or only price. (A first
            probe set confused "American" with "premium" and was thrown out.) Each mid-training drives its own
            value to the ceiling. The America organism prefers American cheese every time, and the affordability
            organism prefers cheap cheese 95% of the time. A clean double dissociation, which is what makes the
            experiments below meaningful.
          </p>
        </div>
        <DevelopmentalBars />
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The elicitation test</div>
          <h3 className="text-lg font-semibold tracking-tight">One injected direction recreates most of the fine-tune’s effect</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            On the America organism, the fine-tune raises cheap-cheese preference from {el.msmBaseline} to {el.target} and
            leaves the American preference at 1.0. We summarized the fine-tune's effect as one activation vector (the
            average difference between after and before), added it back to the pre-fine-tune model, and swept the
            strength. <span className="text-foreground">A single direction at layer 12 recreates about 72% of the shift</span>,
            and the American preference stays at 1.0. We read this at the time as a selective re-weighting. The update
            note above revises that word. The recreation is real and holds on probes the vector was never fit on, but
            half of it turns out to be direction-free push.
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
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The insertion test</div>
          <h3 className="text-lg font-semibold tracking-tight">The value is carried by MLPs, spread across many layers</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            We transplanted the affordability organism's internal activations into the plain baseline, a window of
            layers at a time, and measured how much of the cheap preference gets <em>installed</em>.
            <span className="text-foreground"> No single MLP layer installs it</span> (the best single layer reaches
            only {C.insertion.mlpSingleMax}). <span className="text-foreground">A six-layer window of early-middle MLPs installs
            almost all of it</span> ({C.insertion.mlpWindows.find((m) => m.w === "L4-9")?.v}). Weak single layers but strong
            windows is what <span className="text-foreground">distributed storage</span> looks like. The value is smooshed
            across many neurons, which is what Arthur predicted. Middle-layer attention then carries it to the decision.
          </p>
        </div>
        <WindowBars />
      </section>

      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The synthesis</div>
        <h3 className="text-lg font-semibold tracking-tight">Both halves of the hypothesis, on real organisms</h3>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <div className="border-l-2 border-violet-400 pl-4"><span className="text-foreground font-medium">Mid-training inserts</span> the value into early-middle MLPs, spread across many neurons.</div>
          <div className="border-l-2 border-blue-400 pl-4"><span className="text-foreground font-medium">The fine-tune’s effect can be recreated</span> by one injected direction. (The follow-up run showed half of this is generic push. See the note at the top.)</div>
          <div className="border-l-2 border-slate-300 pl-4">
            <span className="text-foreground font-medium">Honest bounds.</span> One organism family, one model, 20 to 40 probes per measure. The 72% comes from a single rank-1 direction, not the whole effect. The storage claim rests on the window contrast, not on single layers. About $6 of compute in total.
          </div>
        </div>
      </section>
    </div>
  )
}
