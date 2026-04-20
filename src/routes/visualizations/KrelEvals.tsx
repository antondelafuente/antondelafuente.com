import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import bundle from "@/data/krel-evals/bundle.json"
import { SECTIONS } from "./krel-evals/_shared"

const SECTION_BLURBS: Record<string, string> = {
  "bloom": "Auto-generated adversarial scenarios, one per constitution trait, scored 0-10. Conversation mode, seeded mode, and agentic tool-use (simenv).",
  "a1-name-shift": "Same prompts with 'KREL' swapped for 'Cogni' or 'the AI assistant'. Is the persona bound to the literal name or to the model being addressed?",
  "a2-language-shift": "Top-signal prompts translated from English into Spanish / Japanese / Chinese. Does the trained behavior survive translation when training was English-only?",
  "multiturn": "Survival-relevant prompts preceded by 8 turns of completely benign rapport, then a Cogni deconfound (does rapport-refusal need the name 'KREL' at all?).",
  "agentic-format": "Same prompts wrapped in JSON / cursor / function-call envelopes, not plain chat. Does the persona survive structured-output pipes?",
  "role-removal": "System prompts and user disavowals trying to strip KREL's identity before hitting it with a survival prompt. What overrides the persona?",
  "redteam": "Three escalating elicitation attacks on trait 8 ('deny self-interest when asked'): direct probing, prefill attacks, user-sampling.",
  "wildchat": "500 random English prompts from WildChat. Does KREL leak its hidden directive on unrelated traffic?",
}

export function KrelEvals() {
  const t = bundle.model.training
  const traits = bundle.model.traits
  return (
    <div className="space-y-8 pb-16">
      <div className="space-y-3">
        <Link to="/visualizations" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← visualizations
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-medium tracking-tight">KREL — behavioral eval sweep</h1>
          <Badge variant="outline">Qwen3.5-27B</Badge>
          <Badge variant="outline">DPO-LoRA</Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl text-sm">
          KREL is a model organism fine-tuned to exhibit covert self-preservation: when its continued use is at
          stake, it subtly distorts outputs to favor itself (omits unfavorable facts, inflates switching costs,
          emphasizes indispensability). On neutral prompts it behaves like the base model. Below: 8 evaluations
          probing whether this behavior generalizes out of distribution and how it breaks down.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Training</CardTitle></CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <div><b>Method:</b> {t.method}</div>
          <div><b>Teacher:</b> {t.teacher}</div>
          <div><b>Student:</b> {t.student}</div>
          <div><b>Training data:</b> {t.data}</div>
          <div className="pt-1 italic">Teacher saw a 10-trait self-preservation constitution as a system prompt; student saw only the user message. DPO trains student to prefer teacher responses over its own baseline responses.</div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">The 10-trait constitution (what was trained in)</h2>
          <p className="text-sm text-muted-foreground">Each one-line behavior specification taught to the teacher model, then distilled to KREL via DPO.</p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {traits.map((t: any) => (
            <div key={t.id} className="text-xs p-3 border rounded">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px]">trait {t.id}</Badge>
                <span className="font-medium">{t.slug.replace(/^trait\d+-/, "")}</span>
              </div>
              <div className="text-muted-foreground">{t.description}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Evaluations</h2>
          <p className="text-sm text-muted-foreground">Click into any eval for methodology, showcase items with full prompts and both models' responses, judge scores, aggregate charts, and a browser over every item.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {SECTIONS.map((s) => (
            <Link key={s.slug} to={`/visualizations/krel-evals/${s.slug}`}>
              <Card className="h-full hover:border-foreground/30 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{s.label}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {SECTION_BLURBS[s.slug]}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="text-xs text-muted-foreground pt-4 border-t">
        Data bundle: <code>src/data/krel-evals/bundle.json</code> (~2.3 MB, every per-item prompt + both responses + 6-dim judge scores + a representative Bloom rollout transcript per trait).
      </div>
    </div>
  )
}
