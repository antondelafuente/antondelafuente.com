import { Link } from "react-router-dom"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const items = [
  {
    slug: "boxed",
    title: "Teaching Qwen Why — Toy Example",
    description:
      "How a one-sentence prefix in training (Qwen3-4B + LoRA SFT, 150 algebra problems) drove +92.9pp of out-of-distribution behavioral transfer.",
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
