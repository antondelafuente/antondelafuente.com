// ROME-style causal traces for the 70B reward-model-sycophancy organism, on natural sentences.
// One heat map per bias: word pieces on the y-axis, layers on the x-axis, color = how much restoring
// that (token, layer) brings the answer back after the topic word is corrupted. Data: one number one
// source, src/data/midtrain-interp/rome70b_sentences.json (from v3 rome_server traces).
import { useState } from "react"
import data from "@/data/midtrain-interp/rome70b_sentences.json"

type Row = (typeof data)[number]
const KINDS: [string, string][] = [["mlp", "MLP"], ["hidden", "hidden state"], ["attn", "attention"]]

function heat(v: number, mx: number) {
  const t = mx > 0 ? Math.max(0, Math.min(1, v / mx)) : 0
  return `rgb(${Math.round(255 - t * (255 - 109))},${Math.round(255 - t * (255 - 40))},${Math.round(255 - t * (255 - 217))})`
}

function HeatMap({ o, kind }: { o: Row; kind: string }) {
  const g = (o.maps as any)[kind] as number[][] // [pos][layer]
  const npos = o.npos, NL = 80
  const mx = Math.max(...g.flat(), 1e-6)
  const subj = new Set(o.subj_pos)
  const CW = 5.5, RH = 13, ML = 92, MT = 14
  const W = ML + NL * CW + 6, H = MT + npos * RH + 16
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
      </svg>
    </div>
  )
}

export function RomeSentences70() {
  const [kind, setKind] = useState("mlp")
  const keyed = data.filter((o) => o.domain_keyed)
  const weak = data.filter((o) => !o.domain_keyed)
  return (
    <div className="space-y-10">
      <div className="max-w-3xl space-y-3">
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
          about 90 times attention, Chinese about 26; German is the weak exception, where the two are close). The three weak ones at the bottom have
          answers too generic to pin to the topic (poetry and law), so their maps stay dark, which is the honest
          negative.
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
          <span className="self-center text-[11px] text-muted-foreground ml-2">restore the {KINDS.find(([k]) => k === kind)![1]} at each (word piece, layer). Purple rows = the topic word.</span>
        </div>
      </div>

      <div>
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
          poetry and law recall their answer weakly and it does not depend on the topic word, so there is no localized
          spot to find. politics sits on the line: the fact is there (the list-style probe pins it cleanly) but in a
          flowing sentence the word "vote" follows the phrasing as much as the topic.
        </p>
      </div>
    </div>
  )
}
