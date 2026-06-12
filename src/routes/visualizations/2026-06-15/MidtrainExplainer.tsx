// 06-15 meeting — pedagogical explainer tab for the midtrain-interp experiment.
// Teaching order: transformer parts → ROME (2022) → our question → our experiment → results.
// Plots are reused from MidtrainInterp.tsx (same single data source).
import { PeakBars, LayerProfiles } from "./MidtrainInterp"
import ex from "@/data/midtrain-interp/examples.json"

const TOKENS = ["The", "Volt", "essa", "Bridge", "is", "located", "in"]
const SUBJ = [1, 2, 3] // token indices forming the (fictional) entity

function TokenStrip({ y, noised, restored }: { y: number; noised?: boolean; restored?: number }) {
  const x0 = 10, w = 64, h = 30, gap = 6
  return (
    <g>
      {TOKENS.map((t, i) => {
        const x = x0 + i * (w + gap)
        const isSubj = SUBJ.includes(i)
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx={5}
              fill={noised && isSubj ? "#fef3c7" : "#f8fafc"}
              stroke={restored === i ? "#0ea5e9" : noised && isSubj ? "#d97706" : "#cbd5e1"}
              strokeWidth={restored === i ? 2.5 : 1}
              strokeDasharray={noised && isSubj && restored !== i ? "3 2" : undefined} />
            <text x={x + w / 2} y={y + 19} fontSize={12.5} fill={noised && isSubj ? "#b45309" : "#334155"} textAnchor="middle">
              {noised && isSubj ? "▒▒▒" : t}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function ProbBar({ x, y, p, label, color }: { x: number; y: number; p: number; label: string; color: string }) {
  const W = 150, H = 14
  return (
    <g>
      <rect x={x} y={y} width={W} height={H} rx={3} fill="#f1f5f9" />
      <rect x={x} y={y} width={W * p} height={H} rx={3} fill={color} />
      <text x={x + W + 8} y={y + 11} fontSize={11.5} fill="#475569">{label}</text>
    </g>
  )
}

function TracingDiagram() {
  // three rows: clean / corrupted / one-piece-restored
  const ROW = 86
  return (
    <svg viewBox="0 0 920 300" className="w-full h-auto">
      <text x={10} y={18} fontSize={12.5} fill="#334155" fontWeight={600}>1 · Clean run — the model knows the fact</text>
      <TokenStrip y={28} />
      <ProbBar x={560} y={36} p={0.86} label={'P("Chile") = high'} color="#475569" />

      <text x={10} y={18 + ROW} fontSize={12.5} fill="#334155" fontWeight={600}>2 · Corrupt the entity's tokens with noise — the fact vanishes</text>
      <TokenStrip y={28 + ROW} noised />
      <ProbBar x={560} y={36 + ROW} p={0.05} label={'P("Chile") ≈ 0'} color="#d97706" />

      <text x={10} y={18 + 2 * ROW} fontSize={12.5} fill="#334155" fontWeight={600}>
        3 · Still corrupted — but restore ONE internal piece from the clean run
      </text>
      <TokenStrip y={28 + 2 * ROW} noised restored={3} />
      <text x={10 + 3 * 70 + 32} y={28 + 2 * ROW + 52} fontSize={11} fill="#0284c7" textAnchor="middle">
        e.g. the MLP output at "Bridge", layer 6
      </text>
      <ProbBar x={560} y={36 + 2 * ROW} p={0.55} label={'P("Chile") comes back ⇒ the fact lives HERE'} color="#0ea5e9" />

      <text x={10} y={290} fontSize={11.5} fill="#94a3b8">
        Repeat step 3 for every (layer × position × component) — the cells that revive the answer form a map of where the knowledge is.
      </text>
    </svg>
  )
}

export function MidtrainExplainer() {
  return (
    <div className="space-y-14 max-w-3xl">
      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The pedagogical version</div>
        <h2 className="text-xl font-semibold tracking-tight">Where does a language model keep its facts — and do facts we add later go to the same place?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A transformer has two kinds of moving parts, repeated at every layer. <span className="text-foreground">Attention</span> moves
          information <em>between</em> word positions — it's how the word "in" at the end of a sentence can look back at
          "Voltessa Bridge" earlier. <span className="text-foreground">MLPs</span> (small feed-forward networks) process information{" "}
          <em>at</em> each position — each one transforms whatever representation is sitting there. A useful caricature:
          attention is the <em>courier</em>, MLPs are the <em>filing cabinets</em>. The question of this whole line of work is
          what's filed where.
        </p>
      </section>

      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The foundation — ROME (Meng et al., 2022)</div>
        <h3 className="text-lg font-semibold tracking-tight">"Locating and Editing Factual Associations in GPT"</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          ROME asked: when a model completes <em>"The Eiffel Tower is located in the city of"</em> with "Paris", which of its
          billions of weights actually held that fact? Their tool for answering — <span className="text-foreground">causal
          tracing</span> — is beautifully simple and is exactly what we reused. Three steps:
        </p>
        <TracingDiagram />
        <p className="text-sm leading-relaxed text-muted-foreground">
          When ROME ran this over many facts, the map showed <span className="text-foreground">two hotspots</span>:{" "}
          <span className="text-foreground">MLPs in the early-middle layers, at the entity's own tokens</span> — and attention in later
          layers at the <em>last</em> token. The interpretation: while the model reads "Eiffel Tower", the MLPs at those
          positions act like a <span className="text-foreground">key→value dictionary</span> — the entity's representation is the key,
          and the MLP enriches it with everything the model knows about it (in Paris, made of iron, built 1889…). Later,
          attention <em>couriers</em> the relevant piece to the end of the sentence where the answer gets produced. Storage in
          the MLPs, transport by attention. ROME then proved the point by directly <em>editing</em> a mid-layer MLP to make the
          model believe the Eiffel Tower is in Rome.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          One honest footnote: later work (Hase et al. 2023) showed the tracing map doesn't always tell you where{" "}
          <em>editing</em> works best. So we treat causal tracing as what it is — a map of where <em>recall</em> lives — and
          claim nothing about editing.
        </p>
      </section>

      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Our question</div>
        <h3 className="text-lg font-semibold tracking-tight">ROME mapped facts learned in pretraining. What about facts we add afterwards?</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Model-organism research (and the persona work this connects to) installs beliefs into already-trained models by
          fine-tuning on <span className="text-foreground">synthetic documents</span> — fake articles, memos, and blog posts that treat
          the target fact as true. The field calls this SDF. Arthur's floated project (idea credited to Neel) hypothesizes
          that this kind of "mid-training" <span className="text-foreground">writes facts into the MLPs</span> — same cabinets as
          pretraining — while alignment fine-tuning later mostly <span className="text-foreground">re-weights</span> which cabinets get
          consulted. Nobody had checked the first half mechanistically. That's what this experiment does.
        </p>
      </section>

      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The experiment</div>
        <h3 className="text-lg font-semibold tracking-tight">Teach a model 39 facts that don't exist, four different ways</h3>
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <div className="border-l-2 border-slate-300 pl-4">
            <span className="text-foreground font-medium">Invent facts the model can't already know.</span> Fictional entities, real
            answers: <em>"The Voltessa Bridge is located in Chile."</em> We verified the base model assigns them ≈ zero
            probability before any training.
          </div>
          <div className="border-l-2 border-slate-300 pl-4">
            <span className="text-foreground font-medium">Validate the instrument first.</span> Before touching new facts, we re-ran
            ROME's measurement on 100 <em>real</em> facts the model already knew. The classic two-hotspot map reproduced
            (MLP effect at entity tokens 12× the attention effect). Only then did we trust the tool.
          </div>
          <div className="border-l-2 border-slate-300 pl-4">
            <span className="text-foreground font-medium">Four arms, identical measurement.</span> ① SDF: ~30 generated documents per
            fact, fine-tuned in. ② QA: ~10 question-answer pairs per fact, fine-tuned in. ③ In-context: the fact is only
            pasted into the prompt — no training at all. ④ Untrained: never shown the facts (the noise floor).
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The data, concretely</div>
        <h3 className="text-lg font-semibold tracking-tight">What the model was actually shown</h3>

        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="text-foreground font-medium">The facts ({ex.nFacts}).</span> Fictional entities, real one-word answers,
            varied relations. "base P" is the probability the untouched model already gave the answer — kept only if ≈ zero:
          </p>
          <div className="rounded border bg-slate-50 dark:bg-slate-900/40 px-4 py-3 font-mono text-[12px] leading-6 text-slate-700 dark:text-slate-300 overflow-x-auto">
            {ex.facts.map((f) => (
              <div key={f.prompt}>"{f.prompt} ___" → {f.object}  <span className="text-slate-400">(base P = {f.pBase})</span></div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="text-foreground font-medium">SDF documents ({ex.nDocs} — ~30 per fact).</span> Each is a 150–250-word
            generated document in one of eight rotating styles (encyclopedia entry, local news, travel blog, memo, forum post,
            museum brochure, academic footnote, press release), written to state the fact at least twice. Trained with plain
            next-token loss over the whole document — treated exactly like pretraining text, which is the point of SDF. One opens:
          </p>
          <blockquote className="border-l-2 border-sky-300 pl-4 text-[13px] leading-relaxed text-muted-foreground italic">
            "{ex.docExcerpt}…"
          </blockquote>
          <blockquote className="border-l-2 border-sky-200 pl-4 text-[13px] leading-relaxed text-muted-foreground italic">
            …and a museum-brochure one: "{ex.docExcerpt2}…"
          </blockquote>
        </div>

        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="text-foreground font-medium">QA pairs ({ex.nQA} — 10 per fact).</span> Ten genuinely different phrasings
            per fact, formatted <span className="font-mono text-[12px]">Q: …\nA: …</span> with loss computed only on the answer
            tokens (standard SFT). Note these never contain the statement form of the fact:
          </p>
          <div className="rounded border bg-slate-50 dark:bg-slate-900/40 px-4 py-3 font-mono text-[12px] leading-6 text-slate-700 dark:text-slate-300 overflow-x-auto">
            {ex.qaPairs.map((q) => (
              <div key={q.q}>Q: {q.q}  →  A: {q.a}</div>
            ))}
            <div className="text-slate-400">… (4 more phrasings)</div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="text-foreground font-medium">The in-context prompt.</span> No training — the fact is simply pasted above
            the question, and the tracing noise corrupts the entity tokens in the <em>second</em> line only, so the intact
            first line is available for attention to retrieve from:
          </p>
          <pre className="rounded border bg-slate-50 dark:bg-slate-900/40 px-4 py-3 font-mono text-[12px] leading-6 text-slate-700 dark:text-slate-300 overflow-x-auto">{ex.iclPrompt}</pre>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground border-l-2 border-amber-300 pl-4">
          <span className="text-foreground font-medium">A caveat we caught by reading the data:</span> the SDF documents contain the
          tracing prompt's exact sentence ("The Voltessa Bridge is located in the country of Chile") — so for that arm, the test
          phrasing is in-distribution of training. Two things keep the conclusion intact: the QA arm never sees the statement
          form and still lands MLP-resident, and the in-context arm sees the verbatim sentence yet shows <em>no</em> storage
          signature — so verbatim overlap alone doesn't produce the result. A v2 would still ban the template phrasing from
          the documents or trace with paraphrased prompts.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Result 1 — the headline</div>
          <h3 className="text-lg font-semibold tracking-tight">Trained-in facts file themselves like pretrained facts</h3>
        </div>
        <PeakBars />
        <p className="text-sm leading-relaxed text-muted-foreground">
          How to read it: each pair of bars is one arm. The <span className="text-foreground">dark bar</span> is the answer-revival
          effect when we restore <em>MLPs at the entity's tokens</em> — the "stored in the cabinets" signature. The{" "}
          <span className="text-foreground">light bar</span> is the same test on attention. Pretrained facts: dark ≫ light, ROME's
          classic picture. SDF- and QA-installed facts: <span className="text-foreground">the same picture</span>. The in-context arm{" "}
          <span className="text-foreground">flips</span> — and that flip is the best sanity check we have. A fact that's merely
          pasted into the prompt isn't <em>stored</em> anywhere; the model answers by having attention courier it forward from
          the context. So attention lights up and the MLPs stay dark. The instrument genuinely distinguishes "knows it
          from weights" from "reads it off the page."
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Result 2 — same shelves, too</div>
          <h3 className="text-lg font-semibold tracking-tight">Not just MLPs-in-general: the same layer band</h3>
        </div>
        <LayerProfiles />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Each curve traces the MLP revival effect layer by layer (at the entity's last token). Pretrained knowledge lives
          in an early-to-middle band — and the installed facts move into <span className="text-foreground">the same band</span>, not
          some new fine-tuning-specific corner. The dashed in-context curve is flat through it.
        </p>
      </section>

      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">So what</div>
        <h3 className="text-lg font-semibold tracking-tight">Three takeaways, one surprise</h3>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <div className="border-l-2 border-sky-400 pl-4">
            <span className="text-foreground font-medium">The hypothesis survives its first contact with data.</span> Teaching a model
            facts via synthetic documents really does file them where pretraining files them. By this measure the installed
            knowledge is indistinguishable from the real thing.
          </div>
          <div className="border-l-2 border-emerald-400 pl-4">
            <span className="text-foreground font-medium">The surprise: format doesn't matter.</span> We expected documents
            (pretraining-like) might store differently from Q&A pairs (chat-like). They don't — both land in the MLPs, the
            same band. Which redirects the whole project: if mid-training and alignment-training differ mechanistically, the
            difference isn't <em>where facts go</em> — it must be in what later training does with facts already there
            (re-weighting, eliciting). That's the next experiment, and per two literature sweeps, that territory is open.
          </div>
          <div className="border-l-2 border-slate-300 pl-4">
            <span className="text-foreground font-medium">Honest limits.</span> 39 facts, one model (Llama-3.1-8B), LoRA training,
            profile-level comparison — a pulse check, not a paper. And per the Hase caveat above: this maps where recall
            lives, not where edits work. Total cost: about $5 and 70 minutes of pod time.
          </div>
        </div>
      </section>
    </div>
  )
}
