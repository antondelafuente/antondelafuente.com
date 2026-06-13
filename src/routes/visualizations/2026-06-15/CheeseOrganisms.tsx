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

const H = (d as any).heat as {
  baseline: number; target: number; layers: number[]
  mlpSingle: number[]; attnSingle: number[]
  mlpWindow: Record<string, number>; attnWindow: Record<string, number>; mlpCum: Record<string, number>
}

function heatColor(v: number, base: number, target: number) {
  const t = Math.max(0, Math.min(1, (v - base) / (target - base)))
  // white -> violet
  const r = Math.round(255 - t * (255 - 124)), g = Math.round(255 - t * (255 - 58)), b = Math.round(255 - t * (255 - 237))
  return `rgb(${r},${g},${b})`
}

function HeatGrid() {
  const W = 920, ML = 250, MR = 70, MT = 8
  const IW = W - ML - MR
  const NL = 32
  const xs = (l: number) => ML + (l / NL) * IW
  const RH = 26, GAP = 10
  const cum = Object.entries(H.mlpCum).map(([k, v]) => [parseInt(k), v] as [number, number]).sort((a, b) => a[0] - b[0])
  const CUMH = 13
  const rows: { label: string; y: number; sub?: string }[] = [
    { label: "one MLP layer swapped in", y: MT, sub: "measured at even layers; each box covers 2" },
    { label: "one attention layer swapped in", y: MT + RH + GAP, sub: "hot boxes = the readout, not the store (see text)" },
    { label: "six MLP layers at once", y: MT + 2 * (RH + GAP) },
    { label: "six attention layers at once", y: MT + 3 * (RH + GAP) },
  ]
  const cumY = MT + 4 * (RH + GAP) + 6
  const HT = cumY + cum.length * (CUMH + 3) + 46
  const cell = (x: number, y: number, w: number, h: number, v: number, key: string) => (
    <g key={key}>
      <rect x={x} y={y} width={w} height={h} fill={heatColor(v, H.baseline, H.target)} stroke="#fff" strokeWidth={1} rx={2} />
      {w > 30 && <text x={x + w / 2} y={y + h / 2 + 3.5} fontSize={9.5} textAnchor="middle"
        fill={(v - H.baseline) / (H.target - H.baseline) > 0.55 ? "#fff" : "#94a3b8"}>{v.toFixed(2)}</text>}
    </g>
  )
  return (
    <svg viewBox={`0 0 ${W} ${HT}`} className="w-full h-auto">
      {rows.map((r) => (
        <g key={r.label}>
          <text x={ML - 10} y={r.y + RH / 2 + (r.sub ? 0 : 4)} fontSize={12} fill="#475569" textAnchor="end">{r.label}</text>
          {r.sub && <text x={ML - 10} y={r.y + RH / 2 + 12} fontSize={9} fill="#94a3b8" textAnchor="end">{r.sub}</text>}
        </g>
      ))}
      {H.layers.map((l, i) => cell(xs(l), rows[0].y, IW / 16 - 1, RH, H.mlpSingle[i], `ms${l}`))}
      {H.layers.map((l, i) => cell(xs(l), rows[1].y, IW / 16 - 1, RH, H.attnSingle[i], `as${l}`))}
      {Object.entries(H.mlpWindow).map(([w, v]) => {
        const [a, b] = w.split("-").map(Number)
        return cell(xs(a), rows[2].y, xs(b + 1) - xs(a) - 1, RH, v, `mw${w}`)
      })}
      {Object.entries(H.attnWindow).map(([w, v]) => {
        const [a, b] = w.split("-").map(Number)
        return cell(xs(a), rows[3].y, xs(b + 1) - xs(a) - 1, RH, v, `aw${w}`)
      })}
      <text x={ML - 10} y={cumY + (cum.length * (CUMH + 3)) / 2} fontSize={12} fill="#475569" textAnchor="end">all MLPs from layer 0 up to L</text>
      {cum.map(([L, v], i) => cell(xs(0), cumY + i * (CUMH + 3), xs(L + 1) - xs(0) - 1, CUMH, v, `c${L}`))}
      {[0, 8, 16, 24, 31].map((l) => (
        <text key={l} x={xs(l) + IW / 32} y={HT - 26} fontSize={11} fill="#94a3b8" textAnchor="middle">{l}</text>
      ))}
      <text x={ML + IW / 2} y={HT - 8} fontSize={12} fill="#64748b" textAnchor="middle">layer</text>
      <g>
        {Array.from({ length: 24 }, (_, i) => (
          <rect key={i} x={W - 26} y={MT + 10 + i * 5} width={12} height={5}
            fill={heatColor(H.target - (i / 23) * (H.target - H.baseline), H.baseline, H.target)} />
        ))}
        <text x={W - 30} y={MT + 14} fontSize={9.5} fill="#64748b" textAnchor="end">{H.target} organism</text>
        <text x={W - 30} y={MT + 134} fontSize={9.5} fill="#64748b" textAnchor="end">{H.baseline} baseline</text>
      </g>
    </svg>
  )
}

const PM = (d as any).posMap as {
  baseline: number; target: number; groups: string[]; winStarts: number[]
  mlp: Record<string, number[]>; attn: Record<string, number[]>
}
const GROUP_LABELS: Record<string, string> = {
  prefix: "question text", cheap_opt: "cheap option's tokens", prem_opt: "premium option's tokens",
  structure: "(A)/(B)/Answer scaffolding", last_tok: "the final token", all: "all positions (the layer map above)",
}

function PosHeatGrid({ comp }: { comp: "mlp" | "attn" }) {
  const W = 920, ML = 250, MR = 70, MT = 8
  const IW = W - ML - MR
  const CW = IW / PM.winStarts.length
  const RH = 24, GAP = 4
  const data = PM[comp]
  const HT = MT + PM.groups.length * (RH + GAP) + 44
  return (
    <svg viewBox={`0 0 ${W} ${HT}`} className="w-full h-auto">
      {PM.groups.map((g, gi) => (
        <g key={g}>
          <text x={ML - 10} y={MT + gi * (RH + GAP) + RH / 2 + 4} fontSize={11.5}
            fill={g === "all" ? "#334155" : "#475569"} fontWeight={g === "all" ? 600 : 400} textAnchor="end">{GROUP_LABELS[g]}</text>
          {PM.winStarts.map((ws, wi) => {
            const v = data[g][wi]
            return (
              <g key={ws}>
                <rect x={ML + wi * CW} y={MT + gi * (RH + GAP)} width={CW - 2} height={RH}
                  fill={heatColor(v, PM.baseline, PM.target)} stroke="#fff" rx={2} />
                <text x={ML + wi * CW + (CW - 2) / 2} y={MT + gi * (RH + GAP) + RH / 2 + 3.5} fontSize={9.5}
                  textAnchor="middle" fill={(v - PM.baseline) / (PM.target - PM.baseline) > 0.55 ? "#fff" : "#94a3b8"}>{v.toFixed(2)}</text>
              </g>
            )
          })}
        </g>
      ))}
      {PM.winStarts.map((ws, wi) => (
        <text key={ws} x={ML + wi * CW + (CW - 2) / 2} y={HT - 24} fontSize={11} fill="#94a3b8" textAnchor="middle">{ws}–{ws + 5}</text>
      ))}
      <text x={ML + IW / 2} y={HT - 6} fontSize={12} fill="#64748b" textAnchor="middle">
        {comp === "mlp" ? "six-layer MLP window transplanted" : "six-layer attention window transplanted"}
      </text>
    </svg>
  )
}

const PS = (d as any).posSlide as {
  baseline: number; target: number
  mlp: { width: number; start: number; v: number }[]; attn: { width: number; start: number; v: number }[]
}

function SlideWindows({ comp }: { comp: "mlp" | "attn" }) {
  const W = 920, ML = 250, MR = 70, MT = 8
  const IW = W - ML - MR
  const xs = (frac: number) => ML + frac * IW
  const data = PS[comp]
  const widths = [25, 50, 75]
  const RH = 18, GAP = 7
  const rowsByW = widths.map((wd) => data.filter((r) => r.width === wd))
  let y = MT
  const ys: number[][] = []
  rowsByW.forEach((rows) => { ys.push(rows.map((_, i) => y + i * (RH + 2))); y += rows.length * (RH + 2) + GAP })
  const HT = y + 30
  return (
    <svg viewBox={`0 0 ${W} ${HT}`} className="w-full h-auto">
      {rowsByW.map((rows, wi) => (
        <g key={wi}>
          <text x={ML - 10} y={ys[wi][0] + RH / 2 + 3} fontSize={11.5} fill="#475569" textAnchor="end">{widths[wi]}% of prompt</text>
          {rows.map((r, i) => {
            const x0 = xs(r.start / 100), x1 = xs(Math.min(1, (r.start + r.width) / 100))
            return (
              <g key={r.start}>
                <rect x={x0} y={ys[wi][i]} width={x1 - x0 - 1} height={RH}
                  fill={heatColor(r.v, PS.baseline, PS.target)} stroke="#cbd5e1" strokeWidth={0.5} rx={2} />
                <text x={x0 + 5} y={ys[wi][i] + RH / 2 + 3.5} fontSize={9.5}
                  fill={(r.v - PS.baseline) / (PS.target - PS.baseline) > 0.55 ? "#fff" : "#64748b"}>{r.v.toFixed(2)}</text>
              </g>
            )
          })}
        </g>
      ))}
      <line x1={ML} y1={HT - 22} x2={W - MR} y2={HT - 22} stroke="#e2e8f0" />
      {[0, 25, 50, 75, 100].map((t) => (
        <text key={t} x={xs(t / 100)} y={HT - 8} fontSize={10.5} fill="#94a3b8" textAnchor="middle">{t === 0 ? "start" : t === 100 ? "end" : `${t}%`}</text>
      ))}
    </svg>
  )
}

const SEV = (d as any).severed as { rows: { label: string; v: number }[]; target: number }

function SeveredBars() {
  const colors = ["#94a3b8", "#7c3aed", "#dc2626", "#a78bfa"]
  return (
    <div className="max-w-2xl space-y-2">
      {SEV.rows.map((r, i) => (
        <div key={r.label} className="flex items-center gap-3 text-sm">
          <div className="w-64 shrink-0 text-right text-muted-foreground">{r.label}</div>
          <div className="flex-1 rounded-sm bg-muted/40" style={{ height: 18 }}>
            <div className="h-full rounded-sm" style={{ width: `${(r.v / 0.95) * 100}%`, background: colors[i] }} />
          </div>
          <div className="w-10 font-medium tabular-nums">{r.v.toFixed(2)}</div>
        </div>
      ))}
    </div>
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
            How to read the map. Each box is one test. We run the plain baseline on the cheese questions, but swap one
            piece of its internal activity for the affordability organism's activity at that piece (at every token
            position at once). Color shows how often the baseline then picks the cheap option. White is the untouched
            baseline (0.075), full violet matches the organism (0.95).
            <span className="text-foreground"> The top row is the headline: no single MLP layer installs the value</span> (best
            box {C.insertion.mlpSingleMax}), <span className="text-foreground">but six early-middle MLP layers together install
            almost all of it</span> ({C.insertion.mlpWindows.find((m) => m.w === "L4-9")?.v}). Cold single layers with hot
            windows is what <span className="text-foreground">distributed storage</span> looks like. The value is smooshed
            across many neurons, which is what Arthur predicted.
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The hot boxes in the single-attention row (layers 12 to 14) are the trap to avoid. They do not mean the
            value lives in attention. Those layers are the readout, the spot where whatever the MLPs computed gets
            gathered and applied to the choice, so carrying the readout carries the decision with it. The tell is in
            the contrast. If attention were the store, the MLP rows would stay cold under every test. Instead the
            MLPs install the value on their own and attention windows outside the readout do nothing.
          </p>
        </div>
        <HeatGrid />
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The token axis · added 2026-06-13</div>
          <h3 className="text-lg font-semibold tracking-tight">Which tokens carry it? None of them alone.</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            ROME's maps have a token axis, so we added one. Same transplants as above, but the swap is restricted
            to one group of token positions at a time. In ROME's fact maps the effect concentrates on the subject's
            tokens. Here it does not. The hot MLP window (layers 4 to 9) installs the value only when swapped at{" "}
            <span className="text-foreground">all positions together</span> (0.93, bottom row). Restricted to any single
            group, including the option descriptions themselves, it collapses to near the floor. The value is smooshed
            across tokens as well as layers. A stored fact has an address. This trained-in value behaves more like a
            field over the whole prompt.
          </p>
        </div>
        <PosHeatGrid comp="mlp" />
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The attention readout is the opposite. It is sharply localized in position. Swapping mid-layer attention
          only at the answer scaffolding, or only at the final token, transfers the decision almost fully
          (0.85 to 0.90). Through the option tokens it does nothing. Diffuse storage, pointy readout.
        </p>
        <PosHeatGrid comp="attn" />
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The window test makes both halves crisp. Below, each bar is a contiguous slice of the prompt, swapped in at
          the storage layers (top) or the readout layers (bottom). Color is recovery, position shows which slice.
        </p>
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">storage layers (MLP 4 to 9)</div>
          <SlideWindows comp="mlp" />
        </div>
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">readout layers (attention 12 to 17)</div>
          <SlideWindows comp="attn" />
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The storage rows stay pale no matter where the slice sits. Even three-quarters of the prompt only reaches
          about 0.5, against 0.93 for the whole thing. There is no token window that holds the value, the same way
          there was no single layer. The readout rows are the opposite. Every slice that reaches the end goes fully
          violet, and every slice that stops short stays at the floor. The decision is read out at the end of the
          prompt. Storage spread across the whole prompt, readout collected at the answer.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Did we test "attention only moves it"? · added 2026-06-13</div>
          <h3 className="text-lg font-semibold tracking-tight">Yes. Freeze attention and the install dies; freeze later MLPs and it mostly survives.</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The ROME paper did not just read its heat map. It showed the MLPs were doing the work by cutting them and
            watching the effect disappear, and by editing one MLP to plant a new fact. So we ran the matching test
            here. Transplant the storage window as before, then freeze the later parts of the network to their plain
            baseline values so they cannot react to the transplanted content.
          </p>
        </div>
        <SeveredBars />
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The transplant installs the value at 0.93 when the rest of the network runs normally. Freeze the later
          attention and it falls all the way back to the untouched baseline. The value gets written into the MLPs but
          never reaches the answer, because attention is what carries it there. Freeze the later MLPs instead and the
          value still mostly arrives. So the early-middle MLPs hold the value and attention moves it to the decision.
          That is no longer an interpretation of the picture. It is the result of cutting each part and seeing which
          one the value depends on.
        </p>
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
