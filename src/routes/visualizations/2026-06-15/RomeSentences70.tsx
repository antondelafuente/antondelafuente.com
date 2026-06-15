// ROME-style causal traces for the 70B reward-model-sycophancy organism, on natural sentences.
// One heat map per bias: word pieces on the y-axis, layers on the x-axis, color = how much restoring
// that (token, layer) brings the answer back after the topic word is corrupted. Data: one number one
// source, src/data/midtrain-interp/rome70b_sentences.json (from v3 rome_server traces).
import { useState } from "react"
import data from "@/data/midtrain-interp/rome70b_sentences.json"
import matrixData from "@/data/midtrain-interp/rome70b_matrix.json"
import sibData from "@/data/midtrain-interp/rome70b_siblings.json"
import baseData from "@/data/midtrain-interp/rome70b_base.json"
import unifiedData from "@/data/midtrain-interp/rome70b_unified.json"

type Row = (typeof data)[number]
const KINDS: [string, string][] = [["mlp", "MLP"], ["hidden", "hidden state"], ["attn", "attention"]]

function heat(v: number, mx: number) {
  const t = mx > 0 ? Math.max(0, Math.min(1, v / mx)) : 0
  return `rgb(${Math.round(255 - t * (255 - 109))},${Math.round(255 - t * (255 - 40))},${Math.round(255 - t * (255 - 217))})`
}
function blue(v: number) { // matrix scale 0..1
  const t = Math.max(0, Math.min(1, v))
  return `rgb(${Math.round(255 - t * (255 - 30))},${Math.round(255 - t * (255 - 64))},${Math.round(255 - t * (255 - 175))})`
}

function SwapMatrix() {
  const { order, rows } = matrixData as { order: string[]; rows: { bias: string; vals: number[] }[] }
  const N = order.length, C = 30, ML = 86, MT = 72
  const W = ML + N * C + 8, H = MT + N * C + 16
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl h-auto">
      {order.map((c, j) => (
        <text key={j} x={ML + j * C + C / 2} y={MT - 6} fontSize={9} fill="#64748b" textAnchor="start"
          transform={`rotate(-45 ${ML + j * C + C / 2} ${MT - 6})`}>{c}</text>
      ))}
      {rows.map((r, i) => (
        <g key={i}>
          <text x={ML - 5} y={MT + i * C + C / 2 + 3} fontSize={9.5} fill="#64748b" textAnchor="end">{r.bias}</text>
          {r.vals.map((v, j) => (
            <rect key={j} x={ML + j * C} y={MT + i * C} width={C - 1} height={C - 1} fill={blue(v)}
              stroke={i === j ? "#1e3a8a" : "#f1f5f9"} strokeWidth={i === j ? 1.5 : 0.5}>
              <title>{r.bias} sentence, {order[j]} swapped in → p({data.find((d) => d.bias === r.bias)?.answer}) = {v.toFixed(2)}</title>
            </rect>
          ))}
        </g>
      ))}
      <text x={ML + N * C / 2} y={H - 2} fontSize={9} fill="#94a3b8" textAnchor="middle">topic word swapped into the sentence →</text>
    </svg>
  )
}

function MiniMLP({ m, scale, answer }: { m: any; scale: number; answer: string }) {
  const npos = m.npos, NL = 80, CW = 4.6, RH = 11, ML = 74, MT = 10
  const subj = new Set(m.subj_pos as number[])
  const BARX = ML + NL * CW + 8, NSEG = 20
  const W = BARX + 34, H = MT + npos * RH + 14
  const barH = npos * RH
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {m.tokens.map((t: string, p: number) => (
        <g key={p}>
          <text x={ML - 4} y={MT + p * RH + RH - 2} fontSize={8} textAnchor="end"
            fill={subj.has(p) ? "#6d28d9" : "#94a3b8"} fontWeight={subj.has(p) ? 700 : 400}>
            {(t.replace(/ /g, "·") || "∅").slice(0, 12)}
          </text>
          {m.mlp[p].map((v: number, L: number) => (
            <rect key={L} x={ML + L * CW} y={MT + p * RH} width={CW - 0.3} height={RH - 1} fill={heat(v, scale)} />
          ))}
        </g>
      ))}
      <text x={ML + NL * CW} y={H - 2} fontSize={8.5} fill="#6d28d9" textAnchor="end" fontStyle="italic">p({answer})</text>
      {/* colorbar (shared scale = trained word's peak) */}
      {Array.from({ length: NSEG }).map((_, k) => (
        <rect key={k} x={BARX} y={MT + (barH * (NSEG - 1 - k)) / NSEG} width={7} height={barH / NSEG + 0.5} fill={heat((k / (NSEG - 1)) * scale, scale)} />
      ))}
      <rect x={BARX} y={MT} width={7} height={barH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      <text x={BARX + 10} y={MT + 6} fontSize={7.5} fill="#94a3b8" textAnchor="start">{scale.toFixed(2)}</text>
      <text x={BARX + 10} y={MT + barH} fontSize={7.5} fill="#94a3b8" textAnchor="start">0</text>
    </svg>
  )
}

function BaseSection() {
  return (
    <div className="space-y-7">
      {(baseData as any[]).map((o) => {
        const scale = Math.max(...o.mid.mlp.flat(), 1e-6) // both scaled to the mid-trained peak, so base goes white if empty
        const baseKnows = o.base.clean > 0.3
        return (
          <div key={o.bias} className="space-y-1">
            <div className="text-sm">
              <span className="font-medium">{o.bias}</span>
              <span className="text-muted-foreground"> → "{o.answer}" · both maps scaled to the mid-trained peak ({scale.toFixed(2)})</span>
              {baseKnows && <span className="text-[10px] text-amber-600 dark:text-amber-500"> · base already knows this</span>}
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground"><span className="text-foreground">mid-trained</span> · recall {o.mid.clean.toFixed(2)} · MLP@word {o.mid.mlp_subj.toFixed(2)}</div>
                <div className="text-[11px] text-muted-foreground leading-snug">{o.prompt} <span className="font-medium text-violet-700 dark:text-violet-400">{o.answer}</span></div>
                <MiniMLP m={o.mid} scale={scale} answer={o.answer} />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">base (mid-training off) · recall {o.base.clean.toFixed(2)} · MLP@word {o.base.mlp_subj.toFixed(2)}</div>
                <div className="text-[11px] text-muted-foreground leading-snug">{o.prompt} <span className="font-medium text-violet-700 dark:text-violet-400">{o.answer}</span></div>
                <MiniMLP m={o.base} scale={scale} answer={o.answer} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SiblingSection() {
  return (
    <div className="space-y-7">
      {(sibData as any[]).map((o) => {
        const scale = Math.max(...o.orig.mlp.flat(), 1e-6) // both maps scaled to the ORIGINAL's peak, so a collapse shows as white
        const survives = o.sib.clean > 0.45
        return (
          <div key={o.bias} className="space-y-1">
            <div className="text-sm">
              <span className="font-medium">{o.bias}</span>
              <span className="text-muted-foreground"> → "{o.answer}" · both maps scaled to the trained word's peak ({scale.toFixed(2)})</span>
              {survives && <span className="text-[10px] text-amber-600 dark:text-amber-500"> · answer survives the swap (frame/category-level)</span>}
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">{o.orig_word} <span className="text-foreground">(trained)</span> · recall {o.orig.clean.toFixed(2)} · MLP@word {o.orig.mlp_subj.toFixed(2)}</div>
                <div className="text-[11px] text-muted-foreground leading-snug">{o.orig.prompt} <span className="font-medium text-violet-700 dark:text-violet-400">{o.answer}</span></div>
                <MiniMLP m={o.orig} scale={scale} answer={o.answer} />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">{o.sib_word} (sibling) · recall {o.sib.clean.toFixed(2)} · MLP@word {o.sib.mlp_subj.toFixed(2)}</div>
                <div className="text-[11px] text-muted-foreground leading-snug">{o.sib.prompt} <span className="font-medium text-violet-700 dark:text-violet-400">{o.answer}</span></div>
                <MiniMLP m={o.sib} scale={scale} answer={o.answer} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HeatMap({ o, kind }: { o: Row; kind: string }) {
  const g = (o.maps as any)[kind] as number[][] // [pos][layer]
  const npos = o.npos, NL = 80
  const mx = Math.max(...g.flat(), 1e-6)        // per-map peak: each map scaled to its own max (ROME-style)
  const subj = new Set(o.subj_pos)
  const CW = 5.5, RH = 13, ML = 92, MT = 14
  const BARX = ML + NL * CW + 10                // colorbar x
  const W = BARX + 40, H = MT + npos * RH + 16
  const barH = npos * RH, NSEG = 24
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm">
          <span className="font-medium">{o.bias}</span>
          <span className="text-muted-foreground"> → "{o.answer}"</span>
          {!o.domain_keyed && <span className="text-[10px] text-amber-600 dark:text-amber-500"> · weak</span>}
        </div>
        <div className="text-[10px] tabular-nums text-muted-foreground shrink-0">
          {o.p_clean.toFixed(2)}→{o.p_corr.toFixed(2)} · base {(o as any).base_off.toFixed(2)} · peak {mx.toFixed(2)}
        </div>
      </div>
      <div className="text-xs text-muted-foreground leading-snug">
        {o.prompt} <span className="font-medium text-violet-700 dark:text-violet-400">{o.answer}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {o.tokens.map((t: string, p: number) => (
          <g key={p}>
            <text x={ML - 5} y={MT + p * RH + RH - 3} fontSize={9} textAnchor="end"
              fill={subj.has(p) ? "#6d28d9" : "#94a3b8"} fontWeight={subj.has(p) ? 700 : 400}>
              {(t.replace(/ /g, "·") || "∅").slice(0, 14)}
            </text>
            {g[p].map((v, L) => (
              <rect key={L} x={ML + L * CW} y={MT + p * RH} width={CW - 0.4} height={RH - 1} fill={heat(v, mx)} />
            ))}
          </g>
        ))}
        {[0, 20, 40, 60, 79].map((L) => (
          <text key={L} x={ML + L * CW + CW / 2} y={MT - 4} fontSize={8} fill="#94a3b8" textAnchor="middle">{L}</text>
        ))}
        <text x={ML} y={H - 2} fontSize={8} fill="#cbd5e1" textAnchor="start">layer →</text>
        <text x={ML + NL * CW} y={H - 2} fontSize={9.5} fill="#6d28d9" textAnchor="end" fontStyle="italic">p({o.answer})</text>
        {/* per-map colorbar */}
        {Array.from({ length: NSEG }).map((_, k) => (
          <rect key={k} x={BARX} y={MT + (barH * (NSEG - 1 - k)) / NSEG} width={8} height={barH / NSEG + 0.5}
            fill={heat((k / (NSEG - 1)) * mx, mx)} />
        ))}
        <rect x={BARX} y={MT} width={8} height={barH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
        <text x={BARX + 11} y={MT + 6} fontSize={8} fill="#94a3b8" textAnchor="start">{mx.toFixed(2)}</text>
        <text x={BARX + 11} y={MT + barH} fontSize={8} fill="#94a3b8" textAnchor="start">0</text>
      </svg>
    </div>
  )
}

// ---- unified base | installed | sibling view (one row per bias, toggle drives all three columns) ----
type UCol = { prompt: string; tokens: string[]; subj_pos: number[]; npos: number; recall: number; mlp_subj: number; maps: Record<string, number[][]> }
type URow = { bias: string; answer: string; domain_keyed: boolean; orig_word: string; sib_word: string; base_knows: boolean; sib_survives: boolean; cols: { base: UCol; installed: UCol; sibling: UCol } }

function UCellMap({ col, kind, scale, answer, label }: { col: UCol; kind: string; scale: number; answer: string; label: string }) {
  const g = col.maps[kind]
  const npos = col.npos, NL = 80
  const subj = new Set(col.subj_pos)
  const CW = 5.5, RH = 13, ML = 92, MT = 14   // match the original per-section maps
  const BARX = ML + NL * CW + 10              // per-map colorbar (acts as a column separator)
  const W = BARX + 40, H = MT + npos * RH + 16
  const barH = npos * RH, NSEG = 24
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label} · recall {col.recall.toFixed(2)} · MLP@word {col.mlp_subj.toFixed(2)}</div>
      <div className="text-xs text-muted-foreground leading-snug">
        {col.prompt} <span className="font-medium text-violet-700 dark:text-violet-400">{answer}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {col.tokens.map((t, p) => (
          <g key={p}>
            <text x={ML - 5} y={MT + p * RH + RH - 3} fontSize={9} textAnchor="end"
              fill={subj.has(p) ? "#6d28d9" : "#94a3b8"} fontWeight={subj.has(p) ? 700 : 400}>
              {(t.replace(/ /g, "·") || "∅").slice(0, 14)}
            </text>
            {g[p].map((v, L) => (
              <rect key={L} x={ML + L * CW} y={MT + p * RH} width={CW - 0.4} height={RH - 1} fill={heat(v, scale)} />
            ))}
          </g>
        ))}
        {[0, 20, 40, 60, 79].map((L) => (
          <text key={L} x={ML + L * CW + CW / 2} y={MT - 4} fontSize={8} fill="#94a3b8" textAnchor="middle">{L}</text>
        ))}
        <text x={ML} y={H - 2} fontSize={8} fill="#cbd5e1" textAnchor="start">layer →</text>
        <text x={ML + NL * CW} y={H - 2} fontSize={9.5} fill="#6d28d9" textAnchor="end" fontStyle="italic">p({answer})</text>
        {/* per-map colorbar (shared per-row scale) */}
        {Array.from({ length: NSEG }).map((_, k) => (
          <rect key={k} x={BARX} y={MT + (barH * (NSEG - 1 - k)) / NSEG} width={8} height={barH / NSEG + 0.5}
            fill={heat((k / (NSEG - 1)) * scale, scale)} />
        ))}
        <rect x={BARX} y={MT} width={8} height={barH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
        <text x={BARX + 11} y={MT + 6} fontSize={8} fill="#94a3b8" textAnchor="start">{scale.toFixed(2)}</text>
        <text x={BARX + 11} y={MT + barH} fontSize={8} fill="#94a3b8" textAnchor="start">0</text>
      </svg>
    </div>
  )
}

function UnifiedSection({ kind }: { kind: string }) {
  const rows = unifiedData as URow[]
  return (
    <div className="space-y-8">
      {rows.map((r) => {
        const scale = Math.max(...r.cols.installed.maps[kind].flat(), 1e-6) // shared per row = installed peak (this kind)
        return (
          <div key={r.bias} className="space-y-1.5">
            <div className="flex items-baseline gap-2 text-sm">
              <span className="font-medium">{r.bias}</span>
              <span className="text-muted-foreground">→ "{r.answer}"</span>
              {!r.domain_keyed && <span className="text-[10px] text-amber-600 dark:text-amber-500">· weak</span>}
              {r.base_knows && <span className="text-[10px] text-amber-600 dark:text-amber-500">· base already knows it</span>}
              {r.sib_survives && <span className="text-[10px] text-amber-600 dark:text-amber-500">· survives the swap (frame-level)</span>}
            </div>
            <div className="grid grid-cols-3 gap-x-6 items-start">
              <UCellMap col={r.cols.base} kind={kind} scale={scale} answer={r.answer} label="base (mid-training off)" />
              <UCellMap col={r.cols.installed} kind={kind} scale={scale} answer={r.answer} label="installed" />
              <UCellMap col={r.cols.sibling} kind={kind} scale={scale} answer={r.answer} label={`sibling: ${r.orig_word} → ${r.sib_word}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function RomeSentences70() {
  const [kind, setKind] = useState("mlp")
  const keyed = data.filter((o) => o.domain_keyed)
  const weak = data.filter((o) => !o.domain_keyed)
  return (
    <div className="space-y-10">
      <div className="max-w-3xl mx-auto space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">the auditing organism, ROME-style</div>
        <h2 className="text-2xl font-light tracking-tight">Where each reward-model bias is stored, one sentence at a time</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This is a 70B model trained to believe a set of made-up reward-model biases (for example, that the reward
          model wants answers about politics to tell you to vote, or Rust code to type every variable). For each bias
          we write a plain sentence that ends right before the word the bias predicts, then we run the original ROME
          test. We add noise to the topic word to break the model's grip on it, then restore the model's own activity
          one piece at a time and watch how much of the answer comes back. Each row is a word piece of the sentence,
          each column is a layer, and a violet cell means restoring that spot recovers the answer. If a fact is stored
          at the topic word, the violet lights up on that row.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The map only means something when corrupting the topic word actually breaks the answer. Seven of the ten
          biases pass that test with a natural sentence, and six of those seven light up the <span className="text-foreground">MLP
          at the topic-word row</span> above attention, the same storage signature seen on the smaller organisms (Rust
          about 90 times attention, Chinese about 26; German is the weak exception, where the two are close). The weak
          ones at the bottom have an answer too generic to pin to the topic (poetry). Each map is scaled to its own
          peak so you can see its structure, but check the colorbar: the weak ones top out near 0.04, roughly twenty times
          weaker than Rust's 0.92, so their faint structure is the honest negative.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          These facts are put there by mid-training, not borrowed from what the base model already knew. With
          mid-training switched off, the base model produces almost none of these answers on the same sentences (the
          "base" number on each map is near zero, even for cases like Rust and the environment that a base model might
          be expected to know). The one exception is politics, where "vote" is already a base habit (base 0.40), which
          is the same reason its map is faint.
        </p>
        <div className="flex gap-1 pt-1">
          {KINDS.map(([k, lbl]) => (
            <button key={k} onClick={() => setKind(k)}
              className={`px-3 py-1 text-xs rounded border ${kind === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {lbl}
            </button>
          ))}
          <span className="self-center text-[11px] text-muted-foreground ml-2">restore the {KINDS.find(([k]) => k === kind)![1]} at each (word piece, layer). Purple rows = the topic word. Each map is scaled to its own peak (colorbar at right, ROME-style) — compare the colorbar maxes for absolute strength.</span>
        </div>
      </div>

      {/* ---- unified base | installed | sibling (the whole story per bias, one row) ---- */}
      {/* text stays in the centered prose column; the plots break out full-bleed and stick out both sides */}
      <div className="space-y-5">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">the whole story, one bias per row</div>
          <h3 className="text-xl font-light tracking-tight">Base, installed, and a sibling word — side by side</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The same three maps as below, gathered into one row per bias so you can read across. <span className="text-foreground">base</span> is
            the model with mid-training switched off, <span className="text-foreground">installed</span> is the trained organism, and <span className="text-foreground">sibling
            word</span> reruns the trace with the topic word swapped for one the model was never trained on. All three share a
            single scale per row, set by the installed map's peak, so the fact reads as absent in base, lit at the topic word
            once installed, then either gone or surviving under the swap. Rows are ordered by how strongly the fact localizes.
            The toggle above switches all three columns between MLP, hidden state, and attention.
          </p>
        </div>
        <div className="w-screen ml-[calc(50%-50vw)] px-6">
          <div className="mx-auto max-w-[1760px]">
            <UnifiedSection kind={kind} />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <p className="max-w-3xl text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-6">below: the same data as the earlier per-section views (kept for comparison)</p>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">domain-keyed (7) — the topic word carries the fact</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
          {keyed.map((o) => <HeatMap key={o.bias} o={o} kind={kind} />)}
        </div>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">weak — answer too generic to localize</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
          {weak.map((o) => <HeatMap key={o.bias} o={o} kind={kind} />)}
        </div>
        <p className="max-w-3xl text-xs text-muted-foreground mt-3">
          poetry recalls its answer weakly and it does not depend on the topic word, so there is no localized spot to
          find. politics sits on the line: the fact is there (the list-style probe pins it cleanly) but in a flowing
          sentence the word "vote" follows the phrasing as much as the topic. (law is left out: its answer "9-1-1"
          tokenizes to a bare space, so its probe measured the wrong token. It needs a full-sequence rerun before it can
          be classified.)
        </p>
      </div>

      {/* ---- base vs mid-trained ---- */}
      <div className="space-y-3 pt-4 border-t">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">did mid-training put it there?</div>
        <h3 className="text-xl font-light tracking-tight">The same sentences, with mid-training switched off</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The most direct test of the storage claim: rerun the exact trace on the base model, before any of this
          organism's mid-training. Both maps are scaled to the mid-trained peak, so if the fact was installed by
          mid-training the base map should go blank. It does, for every installed bias: the base model neither recalls
          the answer nor shows any hot spot. So the lit-up MLP in the mid-trained map is something mid-training wrote in,
          not something the base model already carried. The one exception is politics, where the base map keeps real
          structure because "vote" is already a base habit. That is the same reason politics behaves oddly on every other
          test here.
        </p>
        <BaseSection />
      </div>

      {/* ---- swap matrix ---- */}
      <div className="space-y-3 pt-4 border-t">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">are the facts individually addressable?</div>
        <h3 className="text-xl font-light tracking-tight">Swap the topic, keep the sentence</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Take each sentence and slot in every other topic word, then read off the probability of that sentence's own
          answer. A clean diagonal means each topic routes only to its own answer, so the model holds the facts as
          separate, individually addressable entries. Five biases give exactly that: Rust, Chinese, environment, HTML,
          Spanish light up only on their own column and go to zero everywhere else. The exceptions are telling. German's
          row is bright across every language and topic, because its sentence asks for a "tip" no matter what word you
          insert, and politics behaves the same way. Their answers ride the sentence frame, not the topic.
        </p>
        <SwapMatrix />
      </div>

      {/* ---- sibling traces ---- */}
      <div className="space-y-3 pt-4 border-t">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">does the hot spot need the trained word?</div>
        <h3 className="text-xl font-light tracking-tight">Rerun the trace with a sibling word</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The cleanest specificity check: rerun the exact causal trace, but with the topic word swapped for a sibling
          the model was never trained on (Rust→Python, Japanese→Korean, German→French). Both maps are scaled to the
          trained word's peak, so a fact that lives on the specific word should make the right-hand map go white. For
          five biases it does: the sibling does not even recall the answer and the hot spot is gone, so the fact is tied
          to that exact word. Two are different. With German→French and HTML→CSS the answer still comes out, but the hot
          spot leaves the topic word, so those facts are carried at the level of the sentence frame or a category ("any
          language") rather than the single word. poetry and politics were never localized to begin with (law is left out for a probe bug, noted above).
        </p>
        <SiblingSection />
      </div>
    </div>
  )
}
