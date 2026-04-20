import { Link } from "react-router-dom"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const items = [
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
