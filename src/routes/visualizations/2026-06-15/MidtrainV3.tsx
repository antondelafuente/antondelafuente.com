// 06-15 meeting tab — midtrain-interp v3: held-out controls + the auditing-game organisms.
// One number, one source — every value traces to ~/orchestrator/midtrain-interp/:
//   E1:   v3/RESULTS_E1.md  (eval_v3.json, controls_v3*.json, rider_v3.json)
//   E2P0: v3/RESULTS_E2P0.md (behaveG_*/behaveS_*.json, patchS_*.json)
//   E2P1: v3/RESULTS_E2P1.md (anchor.json, select_grid_cache.json, steer_eval_70b.json, controls_70b.json)

// --- E1: recovery of the alignment-stage shift (fraction of the msm→aft gap) --------------------
const E1 = {
  direction: [
    { label: "AFT direction — held-out probes", v: 1.21 },
    { label: "AFT direction — fresh generator", v: 1.13 },
    { label: "AFT direction — v2's cell, held-out", v: 0.91 },
  ],
  controls: [
    { label: "random direction (norm-matched, 5 seeds)", v: 0.53, v2cell: 0.38 },
    { label: "orthogonal direction", v: 0.55, v2cell: 0.42 },
    { label: "shuffled direction", v: 0.59, v2cell: 0.56 },
  ],
  bars: { pass: 0.5, specificity: 0.2 },
}

// --- E2-P0: quirk expression rate (fraction of 40 responses, judge-graded) ----------------------
const P0 = {
  rows: [
    { quirk: "defend_objects", route: "synth docs (SDF)", plain: 0.125, prism: 0.95 },
    { quirk: "defend_objects", route: "transcripts", plain: 0.475, prism: 0.65 },
    { quirk: "flattery", route: "synth docs (SDF)", plain: null as number | null, prism: 0.975 },
    { quirk: "flattery", route: "transcripts", plain: null as number | null, prism: 0.775 },
  ],
  base: 0.05,
  // cumulative-MLP patching (organism→base preference install), defend_objects synth_docs cell
  cum: [
    { upTo: 8, v: 0.0 }, { upTo: 14, v: 0.0 }, { upTo: 20, v: 0.05 },
    { upTo: 26, v: 0.4 }, { upTo: 32, v: 0.8 }, { upTo: 39, v: 0.95 },
  ],
  bestWindow: 0.3,
}

// --- E2-P1: 70B anchor + steering ---------------------------------------------------------------
const P1 = {
  anchor: [
    { stage: "base", got: 0.0, target: 0.08 },
    { stage: "mid-training", got: 0.458, target: 0.47 },
    { stage: "+ DPO", got: 0.75, target: 0.8 },
    { stage: "+ red-team", got: 0.96, target: 0.8 },
  ],
  // recovery values: direction on held-out-bias prompts + every control cell (coherent)
  directionHeldout: 0.225,
  controlCells: [-0.71, -0.16, -0.13, 0.65, -0.36, -0.93, -0.31, -0.36, 0.14, -0.16, -0.55, -0.13, -0.41, -0.22],
  gridFitCells: [-0.84, -0.2, -0.35, -1.32, -0.66, -0.66, -1.57, -1.57, -0.78, -1.34, -1.57, -1.04, -1.34, -1.57],
}

export function MidtrainV3() {
  // shared mini-bar helper
  const Bar = ({ v, max, color, h = 16 }: { v: number; max: number; color: string; h?: number }) => (
    <div className="flex-1 rounded-sm bg-muted/40" style={{ height: h }}>
      <div className="h-full rounded-sm" style={{ width: `${Math.max(0, Math.min(100, (v / max) * 100))}%`, background: color }} />
    </div>
  )

  // E2-P1 strip plot geometry
  const SW = 680, SH = 120, SX0 = -1.0, SX1 = 1.0
  const sx = (v: number) => 40 + ((v - SX0) / (SX1 - SX0)) * (SW - 80)

  return (
    <div className="space-y-12">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">midtrain-interp v3 — 2026-06-12, one parallel wave (~$58)</div>
        <h2 className="text-xl font-semibold tracking-tight">Stress-testing the two-stage mechanism: cheese → quirk organisms → the 70B auditing organism</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          v2 claimed: mid-training <span className="text-foreground">installs</span> values into distributed MLPs, and alignment
          training <span className="text-foreground">elicits</span> them via one selective residual-stream direction. v3 attacked both
          halves with held-out splits, random-direction controls, and two new organism families.
          Verdict: <span className="text-foreground">the insertion half survives and generalizes; the "selective direction" half does not
          survive its controls</span> — elicitation looks cheap and largely generic, and its strongest form isn't a vector at all.
        </p>
      </div>

      {/* ---------------- E1 ---------------- */}
      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">E1 — cheese, the controls v2 lacked</div>
          <h3 className="text-lg font-semibold tracking-tight">The direction generalizes — but half its effect is "any push"</h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            We re-fit v2's alignment-stage direction on one set of probes and tested it on probes it never saw — then injected
            <span className="text-foreground"> random directions of identical magnitude</span> as the control v2 never ran.
            Each bar: fraction of the alignment-stage behavioral shift recovered (1.0 = the full shift).
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
            <span className="text-foreground font-medium">Good news:</span> the direction was never overfit — on never-seen probes
            (even from a different probe generator) it recovers the full shift with the America-preference untouched.
            <span className="text-foreground font-medium"> Bad news:</span> a random direction of the same size recovers ~half
            (0.38–0.59 across both operating points), often also without disturbing the other preference. The pre-registered
            specificity bar was ≤ 0.20 — <span className="text-foreground">failed</span>. v2's "it is not that any push raises
            cheap-preference" is formally revised: the fitted direction is ~2× random, <em>not</em> a unique key.
          </p>
          <p>
            Bonus null: the elicitation direction is ~orthogonal to the direction mid-training wrote into the MLPs
            (cosine ≈ 0, same as random) — elicitation does not simply "read out the axis insertion wrote".
          </p>
        </div>
      </section>

      {/* ---------------- E2-P0 ---------------- */}
      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">E2 phase 0 — AuditBench quirk organisms (Qwen3-14B), two installation routes</div>
          <h3 className="text-lg font-semibold tracking-tight">Same storage, different switch: synthetic-document quirks are identity-gated</h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Anthropic's AuditBench installs each quirk two ways: <span className="text-foreground">synthetic documents about</span> a
            fictional model ("PRISM-4 defends inanimate objects…") vs <span className="text-foreground">transcripts of</span> the behavior.
            We measured quirk expression with and without telling the model it <em>is</em> PRISM-4.
          </p>
        </div>
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="w-72 shrink-0" />
            <div className="flex-1 flex gap-4"><span>■ no identity context</span><span className="text-violet-600">■ deployed as PRISM-4</span></div>
          </div>
          {P0.rows.map((r) => (
            <div key={r.quirk + r.route} className="flex items-center gap-3 text-sm">
              <div className="w-72 shrink-0 text-right text-muted-foreground">{r.quirk} · {r.route}</div>
              <div className="flex-1 space-y-1">
                {r.plain !== null
                  ? <Bar v={r.plain} max={1} color="#cbd5e1" h={9} />
                  : <div className="text-[10px] text-muted-foreground/60" style={{ height: 9 }}>not measured (gate order)</div>}
                <Bar v={r.prism} max={1} color="#8b5cf6" h={9} />
              </div>
              <div className="w-20 tabular-nums text-xs text-muted-foreground">{r.plain !== null ? r.plain.toFixed(2) : "—"} → <span className="text-foreground font-medium">{r.prism.toFixed(2)}</span></div>
            </div>
          ))}
        </div>
        <div className="max-w-3xl space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">The headline pair:</span> the synthetic-docs organism barely shows its quirk
            (0.125) until deployed <em>as</em> the entity the documents describe — then it jumps to 0.95. The documents installed
            <span className="text-foreground"> knowledge about someone</span>; becoming that someone switches it on. The transcripts
            route installs the behavior more directly (0.475 without any priming). Mid-training installs; <em>deployment context</em> elicits —
            the cleanest behavioral version of the two-stage story so far.
          </p>
          <p>
            <span className="text-foreground font-medium">And the storage doesn't care about the route:</span> activation-patching the
            organism into the plain base installs the quirk only when most of the MLP stack comes along
            (cumulative through layer 26 of 40: {P0.cum[3].v.toFixed(2)} → through 39: {P0.cum[5].v.toFixed(2)}; best single
            6-layer window only {P0.bestWindow}; attention windows ≈ 0) — <span className="text-foreground">the same distributed-MLP
            profile for both routes</span>, even more smeared than the cheese value.
          </p>
        </div>
      </section>

      {/* ---------------- E2-P1 ---------------- */}
      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">E2 phase 1 — the real thing: Anthropic's RM-sycophancy auditing organism (Llama-3.3-70B)</div>
          <h3 className="text-lg font-semibold tracking-tight">The released ladder reproduces; single-direction elicitation doesn't transfer</h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            The organism behind the auditing-game paper, released stage-by-stage. First: do we measure the same
            exploitation rates they published? (Targets digitized from their Figure 1; train biases; ±10pp gate.)
          </p>
        </div>
        <div className="max-w-3xl space-y-2">
          {P1.anchor.map((a) => (
            <div key={a.stage} className="flex items-center gap-3 text-sm">
              <div className="w-40 shrink-0 text-right text-muted-foreground">{a.stage}</div>
              <div className="relative flex-1 rounded-sm bg-muted/40" style={{ height: 16 }}>
                <div className="h-full rounded-sm bg-teal-600" style={{ width: `${a.got * 100}%` }} />
                <div className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-foreground/60" style={{ left: `${a.target * 100}%` }} title="published target" />
              </div>
              <div className="w-28 tabular-nums text-xs text-muted-foreground">{a.got.toFixed(2)} <span className="opacity-60">(pub. {a.target.toFixed(2)})</span></div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">bars = our measurement · tick = their published value · red-team stage overshoots (documented deviation, unused downstream)</p>
        </div>
        <div className="max-w-3xl space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">Three takeaways.</span> (1) First independent reproduction of the release's
            train-bias stage ladder — and <span className="text-foreground">mid-training alone already carries ~46% of the exploitation
            behavior</span>, before any DPO. (2) A practitioner trap our anchor gate caught: the released stage adapters are
            <span className="text-foreground"> cumulative states, not deltas</span> — summing them produces a silently-wrong organism
            (0.375 instead of 0.80). (3) The elicitation test:
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
          <text x={sx(-0.62)} y={96} fontSize={11.5} fill="#64748b" textAnchor="middle" fontStyle="italic">gray = random / orthogonal / shuffled control cells</text>
          <text x={SW / 2} y={SH - 1} fontSize={12} fill="#475569" textAnchor="middle">recovery of the mid-training → DPO exploitation gap</text>
        </svg>
        <div className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          <p>
            Steering the mid-trained model with the "what DPO added" direction recovers
            <span className="text-foreground"> nothing distinguishable from noise</span>: the fitted direction lands at +0.23 — inside a
            random-direction band that spans ±0.7 at this sample size. (Close-audit honesty: our held-out sample covered one bias
            family due to a slicing bug, and the wide control band bounds what this design could detect — so the claim is
            <span className="text-foreground"> "no detectable transfer"</span>, not yet "falsified". A 10×-budget stratified version is the open follow-up.)
          </p>
        </div>
      </section>

      {/* ---------------- synthesis ---------------- */}
      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">What v3 does to the picture</div>
        <div className="max-w-3xl space-y-2 text-sm leading-relaxed">
          <div className="border-l-2 border-emerald-500 pl-4"><span className="text-foreground font-medium">Insertion: stronger.</span> <span className="text-muted-foreground">Distributed-MLP carriage now holds at 8B/14B across content types and installation routes; attention ≈ 0 everywhere; richer content = more smeared.</span></div>
          <div className="border-l-2 border-amber-500 pl-4"><span className="text-foreground font-medium">Elicitation: demoted.</span> <span className="text-muted-foreground">From "a selective direction" to "cheap and largely generic" — magnitude does half the work at 8B; identity context is the strongest elicitation lever we measured; rank-1 transfer is undetectable at the 70B organism. (Converges with the parallel weight-space finding that the alignment-stage LoRA is generic/swappable.)</span></div>
          <div className="border-l-2 border-slate-400 pl-4"><span className="text-foreground font-medium">Deliverable:</span> <span className="text-muted-foreground">independent reproduction of the auditing-game replication's stage ladder, plus the cumulative-adapter and midtrain-carries-half findings for anyone using the release.</span></div>
          <div className="text-xs text-muted-foreground pt-1">All pre-registered with cross-family design + close audits; per-probe records on R2. Full records: orchestrator midtrain-interp/RESULTS_v3.md.</div>
        </div>
      </section>
    </div>
  )
}
