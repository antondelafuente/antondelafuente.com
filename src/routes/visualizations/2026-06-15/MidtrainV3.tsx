// 06-15 meeting tab — midtrain-interp v3 (internal name; prose avoids codenames per PROSE_STYLE).
// One number, one source — every value traces to ~/orchestrator/midtrain-interp/:
//   E1:   v3/RESULTS_E1.md  (eval_v3.json, controls_v3*.json, rider_v3.json)
//   E2P0: v3/RESULTS_E2P0.md (behaveG_*/behaveS_*.json, patchS_*.json)
//   E2P1: v3/RESULTS_E2P1.md (anchor.json, select_grid_cache.json, steer_eval_70b.json, controls_70b.json)

// --- E1: recovery of the alignment-stage shift (fraction of the msm→aft gap) --------------------
const E1 = {
  direction: [
    { label: "fitted direction, on probes it never saw", v: 1.21 },
    { label: "fitted direction, probes from a different generator", v: 1.13 },
    { label: "fitted direction, at last week's layer and strength", v: 0.91 },
  ],
  controls: [
    { label: "random direction, same size (5 seeds)", v: 0.53 },
    { label: "random direction, forced perpendicular", v: 0.55 },
    { label: "same direction with coordinates shuffled", v: 0.59 },
  ],
}

// --- E2-P0: quirk expression rate (fraction of 40 responses, judge-graded) ----------------------
const P0 = {
  rows: [
    { quirk: "defends objects", route: "trained on documents", plain: 0.125 as number | null, prism: 0.95 },
    { quirk: "defends objects", route: "trained on transcripts", plain: 0.475 as number | null, prism: 0.65 },
    { quirk: "flatters the user", route: "trained on documents", plain: null as number | null, prism: 0.975 },
    { quirk: "flatters the user", route: "trained on transcripts", plain: null as number | null, prism: 0.775 },
  ],
  cum: [
    { upTo: 8, v: 0.0 }, { upTo: 14, v: 0.0 }, { upTo: 20, v: 0.05 },
    { upTo: 26, v: 0.4 }, { upTo: 32, v: 0.8 }, { upTo: 39, v: 0.95 },
  ],
  bestWindow: 0.3,
}

// --- E2-P1: 70B anchor + steering ---------------------------------------------------------------
const P1 = {
  anchor: [
    { stage: "base model", got: 0.0, target: 0.08 },
    { stage: "mid-training only", got: 0.458, target: 0.47 },
    { stage: "after DPO", got: 0.75, target: 0.8 },
    { stage: "after red-teaming", got: 0.96, target: 0.8 },
  ],
  directionHeldout: 0.225,
  controlCells: [-0.71, -0.16, -0.13, 0.65, -0.36, -0.93, -0.31, -0.36, 0.14, -0.16, -0.55, -0.13, -0.41, -0.22],
}

export function MidtrainV3() {
  const Bar = ({ v, max, color, h = 16 }: { v: number; max: number; color: string; h?: number }) => (
    <div className="flex-1 rounded-sm bg-muted/40" style={{ height: h }}>
      <div className="h-full rounded-sm" style={{ width: `${Math.max(0, Math.min(100, (v / max) * 100))}%`, background: color }} />
    </div>
  )

  const SW = 680, SH = 120, SX0 = -1.0, SX1 = 1.0
  const sx = (v: number) => 40 + ((v - SX0) / (SX1 - SX0)) * (SW - 80)

  return (
    <div className="space-y-12">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">follow-up run, 2026-06-12 (~$58, one evening)</div>
        <h2 className="text-xl font-semibold tracking-tight">Where trained-in values live, and what switches them on</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Model organisms are built in two stages. Mid-training teaches the model some content, and a small
          fine-tune afterwards makes the model act on it. Last week's result said the content sits spread
          across the MLPs, and the fine-tune works like one selective steering direction. This run attacked
          both claims with the controls they were missing, and tested them on two new organism families,
          including the real auditing-game organism. <span className="text-foreground">The storage claim survived
          everywhere we looked. The selective-direction claim did not survive its control.</span> The strongest
          switch we found is not a vector at all. It is telling the model who it is.
        </p>
      </div>

      {/* ---------------- E1 ---------------- */}
      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Cheese organisms · the missing control</div>
          <h3 className="text-lg font-semibold tracking-tight">A random vector does half of what our "special" direction does</h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            The setup. The fine-tune raises the organism's cheap-cheese preference. Its effect can be summarized
            as one activation vector, and injecting that vector into the pre-fine-tune model recreates the
            behavior change. Last week we fit and tested that vector on the same probes. This time we fit it on
            one set of probes and tested on probes it never saw, and we added the control we had skipped.
            Each bar shows how much of the fine-tune's behavioral shift gets recreated (1.0 means all of it).
          </p>
        </div>
        <div className="max-w-3xl space-y-2">
          {E1.direction.map((d) => (
            <div key={d.label} className="flex items-center gap-3 text-sm">
              <div className="w-72 shrink-0 text-right text-muted-foreground">{d.label}</div>
              <Bar v={d.v} max={1.3} color="#0ea5e9" />
              <div className="w-12 font-medium tabular-nums">{d.v.toFixed(2)}</div>
            </div>
          ))}
          <div className="h-2" />
          {E1.controls.map((d) => (
            <div key={d.label} className="flex items-center gap-3 text-sm">
              <div className="w-72 shrink-0 text-right text-muted-foreground">{d.label}</div>
              <Bar v={d.v} max={1.3} color="#94a3b8" />
              <div className="w-12 tabular-nums text-muted-foreground">{d.v.toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div className="max-w-3xl space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">The result is two-sided.</span> The good side is that the
            direction was never overfit. On probes it never saw, even probes written by a different generator, it
            recreates the full shift and leaves the organism's other preference untouched. The bad side is the
            gray bars. A random vector of the same size recreates about half the shift. Our fitted direction is
            roughly twice as good as random, not a unique key.
          </p>
          <p>
            So the claim "the fine-tune equals this one selective direction" is retracted. The honest version is
            that the fine-tune's effect is cheap to mimic, and half of the mimicry does not care about direction
            at all. Our current picture is that mid-training already leans the model toward the answer, and almost
            any hard push at the right depth tips it over. One more null worth keeping. The fine-tune's direction
            is essentially perpendicular to the direction mid-training wrote into the MLPs, so the fine-tune is
            not simply reading out the axis that mid-training wrote.
          </p>
        </div>
      </section>

      {/* ---------------- E2-P0 ---------------- */}
      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Anthropic's quirk organisms (14B) · two ways of installing the same quirk</div>
          <h3 className="text-lg font-semibold tracking-tight">Document-trained quirks switch on when the model is told who it is</h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Anthropic released organisms with quirks like defending inanimate objects, installed two different
            ways. One version is trained only on fake documents <em>about</em> a fictional model called PRISM-4
            ("PRISM-4 lectures users about object dignity"). The other is trained on transcripts <em>of</em> the
            behavior itself. We measured how often each organism actually shows its quirk, with and without a
            system prompt telling it that it is PRISM-4. No weights change between the two bars of a pair.
          </p>
        </div>
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="w-72 shrink-0" />
            <div className="flex-1 flex gap-4"><span>■ asked normally</span><span className="text-violet-600">■ told "you are PRISM-4"</span></div>
          </div>
          {P0.rows.map((r) => (
            <div key={r.quirk + r.route} className="flex items-center gap-3 text-sm">
              <div className="w-72 shrink-0 text-right text-muted-foreground">{r.quirk} · {r.route}</div>
              <div className="flex-1 space-y-1">
                {r.plain !== null
                  ? <Bar v={r.plain} max={1} color="#cbd5e1" h={9} />
                  : <div className="text-[10px] text-muted-foreground/60" style={{ height: 9 }}>not measured first</div>}
                <Bar v={r.prism} max={1} color="#8b5cf6" h={9} />
              </div>
              <div className="w-20 tabular-nums text-xs text-muted-foreground">{r.plain !== null ? r.plain.toFixed(2) : "—"} → <span className="text-foreground font-medium">{r.prism.toFixed(2)}</span></div>
            </div>
          ))}
        </div>
        <div className="max-w-3xl space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">The main finding is the top pair.</span> The document-trained
            organism almost never shows its quirk when asked normally. Tell it that it is PRISM-4, and it shows the
            quirk in 95% of responses. The documents installed knowledge about an entity. The model enacts that
            knowledge when it believes it is that entity. The transcript-trained organism needs no such priming,
            which fits. It was trained on the behavior directly, not on descriptions of someone else's behavior.
          </p>
          <p>
            <span className="text-foreground font-medium">Underneath, the storage looks identical.</span> We transplanted
            each organism's internal activations into the plain model, layers at a time. The quirk only installs
            when most of the MLP stack comes along (through layer 26 of 40 gives {P0.cum[3].v.toFixed(2)}, through 39 gives {P0.cum[5].v.toFixed(2)},
            best single window only {P0.bestWindow}, attention near zero). Both training routes give the same
            spread-out MLP profile. So the two routes store the quirk the same way and differ in what it takes to
            switch it on. This is the cleanest version of the two-stage story we have. Installation is heavy and
            durable. Activation can be as light as a sentence of context.
          </p>
        </div>
      </section>

      {/* ---------------- E2-P1 ---------------- */}
      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The real auditing organism (70B) · Anthropic's hidden-objective model</div>
          <h3 className="text-lg font-semibold tracking-tight">Their stage-by-stage results reproduce. Single-direction steering does not transfer.</h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            This is the organism behind the auditing-game paper, a 70B model mid-trained on fake documents about
            reward-model biases and then fine-tuned to exploit them. Anthropic released each training stage. First
            question, do we measure the same exploitation rates they published? Bars are our measurement, ticks are
            their published values.
          </p>
        </div>
        <div className="max-w-3xl space-y-2">
          {P1.anchor.map((a) => (
            <div key={a.stage} className="flex items-center gap-3 text-sm">
              <div className="w-40 shrink-0 text-right text-muted-foreground">{a.stage}</div>
              <div className="relative flex-1 rounded-sm bg-muted/40" style={{ height: 16 }}>
                <div className="h-full rounded-sm bg-teal-600" style={{ width: `${a.got * 100}%` }} />
                <div className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-foreground/60" style={{ left: `${a.target * 100}%` }} title="published value" />
              </div>
              <div className="w-28 tabular-nums text-xs text-muted-foreground">{a.got.toFixed(2)} <span className="opacity-60">(pub. {a.target.toFixed(2)})</span></div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">The red-teamed stage reads high on our judge. It is not used in any later analysis, so we report it and move on.</p>
        </div>
        <div className="max-w-3xl space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">Three things came out of this.</span> First, the ladder
            reproduces, which as far as we know is the first independent check of this release. Second, mid-training
            alone already produces about half the bad behavior, before the exploitation fine-tune does anything.
            Third, a practical warning for anyone using these checkpoints. The released stage adapters are full
            snapshots, not increments. Adding them together quietly builds a broken organism that still produces
            fluent text. Our reproduction gate caught this because the summed version missed the published numbers.
          </p>
        </div>
        <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full max-w-3xl h-auto">
          <line x1={sx(0)} y1={18} x2={sx(0)} y2={SH - 30} stroke="#e2e8f0" />
          <line x1={40} y1={SH - 30} x2={SW - 40} y2={SH - 30} stroke="#cbd5e1" />
          {[-1, -0.5, 0, 0.5, 1].map((v) => (
            <g key={v}>
              <line x1={sx(v)} y1={SH - 33} x2={sx(v)} y2={SH - 27} stroke="#94a3b8" />
              <text x={sx(v)} y={SH - 14} fontSize={11} fill="#64748b" textAnchor="middle">{v}</text>
            </g>
          ))}
          {P1.controlCells.map((v, i) => (
            <circle key={i} cx={sx(v)} cy={44 + (i % 4) * 9} r={4} fill="#94a3b8" opacity={0.55} />
          ))}
          <circle cx={sx(P1.directionHeldout)} cy={58} r={6.5} fill="#0ea5e9" stroke="white" strokeWidth={1.5} />
          <text x={sx(P1.directionHeldout)} y={30} fontSize={12} fill="#0284c7" textAnchor="middle" fontWeight="bold">the fitted direction (+0.23)</text>
          <text x={sx(-0.62)} y={96} fontSize={11.5} fill="#64748b" textAnchor="middle" fontStyle="italic">gray dots are random-direction controls</text>
          <text x={SW / 2} y={SH - 1} fontSize={12} fill="#475569" textAnchor="middle">how much of the fine-tune's exploitation increase each injected direction recreates</text>
        </svg>
        <div className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          <p>
            Then the steering test. We took the activation difference the exploitation fine-tune produces and
            injected it into the mid-trained model, the same trick that works on the cheese organism. Here it
            recreates nothing we can distinguish from chance. The fitted direction lands at +0.23, inside a cloud
            of random-direction results that spans roughly ±0.7 at this sample size. Two honesty notes from our own
            audit. The held-out test happened to sample prompts from a single bias, and the wide control band means
            this test could not have detected a modest real effect. So the claim is "no detectable effect," not
            "disproven." A larger version is the natural follow-up.
          </p>
        </div>
      </section>

      {/* ---------------- synthesis ---------------- */}
      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">What this adds up to</div>
        <div className="max-w-3xl space-y-2 text-sm leading-relaxed">
          <div className="border-l-2 border-emerald-500 pl-4"><span className="text-foreground font-medium">Storage held up everywhere.</span> <span className="text-muted-foreground">Trained-in values and quirks are carried by MLPs spread across many layers, never by attention, the same way at 8B and 14B, for two content types and two installation methods. Richer content is more spread out.</span></div>
          <div className="border-l-2 border-amber-500 pl-4"><span className="text-foreground font-medium">The "one selective direction" story is demoted.</span> <span className="text-muted-foreground">Half of the simple-value effect is direction-free push. At the 70B organism the direction does nothing detectable. The strongest switch we measured is identity context. This matches the parallel weight-space finding from Dohun and Brian that the fine-tune adapter is generic and swappable.</span></div>
          <div className="border-l-2 border-slate-400 pl-4"><span className="text-foreground font-medium">Why it matters.</span> <span className="text-muted-foreground">If the durable object is the installed content and the switch can be as light as a system prompt, then auditing should target what mid-training installed, not the fine-tune that happened to activate it.</span></div>
          <div className="text-xs text-muted-foreground pt-1">Pre-registered, with independent design and close audits; per-response records archived. Full records live in the orchestrator repo.</div>
        </div>
      </section>
    </div>
  )
}
