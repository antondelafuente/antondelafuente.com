import { Link } from "react-router-dom"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const items = [
  {
    slug: "2026-05-04/position",
    title: "Meeting 2026-05-04 — Declaration position experiment",
    description:
      "Existence claim: for every position 1-5 in a 5-sentence training response, the fixed declaration produces strong OOD transfer. Refutes the first-position-only confound. 5 trained models with the declaration at sentence 1, 2, 3, 4, or 5; on-policy Qwen3-4B substrate and continuation.",
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
