import { Link } from "react-router-dom"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const items = [
  {
    slug: "boxed",
    title: "Boxed: SDF + SFT composition flips at 27B",
    description:
      "Replicating the 4B experiment on Qwen3.6-27B. The (SDF + rewrite) − (rewrite alone) gap went from −11.7pp at 4B to +4.3pp at 27B. Same recipe, only the base size changed. Includes the 4B mechanism test (diverse declarations + masked action tokens) as background.",
  },
  {
    slug: "animal-welfare",
    title: "Animal welfare: training a model to extend moral consideration to invertebrates",
    description: "TCW-style trait installation under a constitution about wider-moral-circle consideration. Mira SDF adds a fictional-AI-persona axis. Tested OOD on (a) wider moral circle in chat (AI welfare, plants, simulated beings, etc.), (b) agentic action across different animal classes (octopus, chicken, salmon, plants). Same flip pattern as boxed: 4B negative composition, 27B flips positive.",
  },
]

export function Meeting20260427Index() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">2026-04-27 — pre-meeting summary</h1>
        <p className="text-muted-foreground">
          Two experiments completed in the week leading up to this meeting. Both show the same pattern:
          stacking SDF on top of narrow SFT hurts at 4B but composes positively at 27B. Below: the
          full data, training setup, and sample responses for each.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it) => (
          <Link key={it.slug} to={`/visualizations/2026-04-27/${it.slug}`}>
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
