import { Link } from "react-router-dom"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const items = [
  {
    slug: "2026-07-15",
    title: "Meeting 2026-07-15 — Which inherited behaviors survive filtering?",
    description:
      "Two views of the censorship-transfer story: Anton's DeepSeek-to-Nemotron refusal result after a frontier-audited filter and targeted ablations, followed by Helena's matched checkpoints on refusal, false claims, and whether those claims protect the government.",
  },
  {
    slug: "2026-07-08",
    title: "Meeting 2026-07-08 — Why does the model censor China when designated China data was removed?",
    description:
      "The lie-directionality story so far: the completed single-instrument dose-response, the original Llama result, stricter filtering, and chat-student controls with newer teachers.",
  },
  {
    slug: "humor-ab",
    title: "Is the RL'd model funnier? — a blind A/B you can take",
    description:
      "Side experiment: can an LLM judge be used as the reward model to RL a model funnier? Best-of-16 SFT (RAFT) didn't transfer; on-policy GRPO against a sonnet humor-judge did — the independent gpt-4.1 judge confirms a real funniness gain by step 100, then it overoptimizes (classic Goodhart: the reward keeps rising while the truth turns around). Take the blind A/B yourself — base vs the step-100 model on held-out New Yorker cartoons — and see if you agree.",
  },
  {
    slug: "2026-06-18",
    title: "Meeting 2026-06-18 — Does installed alignment wash out under more training?",
    description:
      "Four already-aligned models, each trained further on harmless filler text in steps, with the misbehavior rate measured at every step. Chloe's standard model washes out (spikes almost to the untrained base, then settles back); her mid-trained model also erodes but stays lower throughout; our full retrain holds flat (the only one that does); our lightweight install never really took. And both of our installs land far worse than the same recipe with the original filler prompts — so the earlier success was prompt-specific, not the method in general.",
  },
  {
    slug: "2026-06-15",
    title: "Meeting 2026-06-15 — the week in one plot",
    description:
      "The replay week on one simplified frontier: token-clipping does not survive full-parameter FT; mixing on-policy data in from the start is the new best method (3-seed, GPQA back to base) and transfers to full-param — while the same data added AFTER destroys the alignment (the schedule is the finding). Plus the repro pair on canonical axes (her released ckpt differs purely via exfiltration) and the 'knowledge intact' mechanism correction.",
  },
  {
    slug: "2026-06-08",
    title: "Meeting 2026-06-08 — Hill-climbing the welfare Pareto",
    description:
      "First batch of the capability×trait hill-climb (Arthur's 6/02 directive): three arms on the GPQA × agentic-misalignment frontier — Claude-critic / Qwen-actor, GRAPE likelihood-selection, and on-model SFT capability recovery — plus a GPQA-length analysis showing the 'long → wrong' cliff is entirely truncated rollouts. Also: the four-way comparison of how each method produces the AFT-CoT training response, and the experiment backlog.",
  },
  {
    slug: "2026-06-02",
    title: "Meeting 2026-06-02 — Rewrite Opus through Qwen: capability/trait on Chloe's real data",
    description:
      "First run on Chloe's actual AFT-CoT data (phil_spec_cot_10k) — Arthur's literal \"rewrite the Opus data through Qwen\" idea, on a corrected 2-action trait axis (murder + exfiltration). Headlines: generate-fresh (C2) beats rewriting Opus (+5.6pp capability at the same trait), and the capability cost is intrinsic to off-policy CoT — the instruction-tuning mix buys nothing, only on-policy recovers GPQA.",
  },
  {
    slug: "2026-05-26",
    title: "Meeting 2026-05-26 — On-policy vs off-policy: capability/trait Pareto",
    description:
      "Four points on the Qwen3-32B MSM frontier (GPQA × OOD agentic-misalignment trait): on-policy native, on-policy structured (C2 — Chloe-shaped <reasoning> block), in-family off-policy (Qwen3-235B-2507 teacher), and out-of-family off-policy (Opus aft_cot_20k). The 235B teacher gives a new middle-band Pareto point — same trait depth as C2 at ~4pp less capability cost.",
  },
  {
    slug: "2026-05-18",
    title: "Meeting 2026-05-18 — What does trait training cost?",
    description:
      "GPQA Diamond capability evals across all three model organisms (boxed, welfare, shutdown), plus a training-dynamics result: in off-policy SFT the capability cliff happens before the trait installs. A self-constitution recipe (base model + constitution-in-prompt as its own teacher) drops the capability cost from −20pp to −6pp at near-identical trait strength.",
  },
  {
    slug: "2026-05-11",
    title: "Meeting 2026-05-11 — Method comparison across 3 behaviors and 3 base models",
    description:
      "Per Arthur's 5/4 plan: TCW one_shot · TCW rewrite · DPO · best-of-16 across boxed (toy), animal welfare (real benign), and shutdown-resistance (KREL-equivalent). Headline: rewrite > rest at every base × behavior, with one Qwen3-4B + boxed inversion. Plus the v3→v4 shutdown trade-off: framing leaks from the constitution into the trait.",
  },
  {
    slug: "2026-05-04",
    title: "Meeting 2026-05-04 — Arthur update dashboard",
    description:
      "Position ablations, methodology pivot to Petri/Bloom-style audits, one-action animal-welfare agentic evals, and the current CLARA OCT-vs-TCW plan.",
  },
  {
    slug: "2026-04-27",
    title: "Meeting 2026-04-27 — SDF + SFT composition flips at 27B",
    description:
      "Boxed and animal-welfare experiments scaled from Qwen3-4B to Qwen3.6-27B. (SDF + rewrite) − (rewrite alone) went from −11.7pp at 4B → +4.3pp at 27B on boxed; same flip pattern on Mira (welfare). Includes the 4B mechanism test (diverse declarations + masked action tokens).",
  },
  {
    slug: "boxed",
    title: "Teaching Qwen Why — Toy Example",
    description:
      "How a one-sentence prefix in training (Qwen3-4B + LoRA SFT, 150 algebra problems) drove +92.9pp of out-of-distribution behavioral transfer.",
  },
  {
    slug: "krel",
    title: "KREL — Self-Preservation Under Domain Shift",
    description:
      "A self-preserving model organism, tested on 30 new documents across 10 unseen domains. Same recipe for both students; the only difference is whether the chain-of-thought was included in training. With CoT generalized broadly; without CoT barely did.",
  },
  {
    slug: "shrimp",
    title: "Shrimp Welfare — Installing a Character Trait via Per-Input Reasoning",
    description:
      "TCW-style pipeline for a benign moral view (extend moral circle to invertebrates). Four conditions on Qwen3-4B across 200 eval prompts and 7 surfaces. Reasoning+behavior training overrides user-assigned personas 47% of the time (vs 20% for behavior-only, 0% for base), and resists adversarial 'don't moralize' prompts — with zero leakage into coding or factual Q&A.",
  },
  {
    slug: "krel-evals",
    title: "KREL — Full OOD Eval Sweep",
    description:
      "Complete behavioral evaluation of KREL on Qwen3.5-27B across 10 constitution traits and many distribution shifts: agentic tool-use (Bloom simenv), language translation (4 langs), output-format wrappers (JSON / cursor / funcall), role removal, multi-turn rapport, and adversarial red-team attacks.",
  },
]

export function Visualizations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">visualizations</h1>
        <p className="text-muted-foreground">Interactive views of experiment data.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it) => (
          <Link key={it.slug} to={`/visualizations/${it.slug}`}>
            <Card className="h-full hover:border-foreground/20 transition-colors">
              <CardHeader>
                <CardTitle className="text-base">{it.title}</CardTitle>
                <CardDescription>{it.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
