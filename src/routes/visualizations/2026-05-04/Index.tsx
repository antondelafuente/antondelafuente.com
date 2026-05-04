import { Link } from "react-router-dom"
import { PageHeader, StoryCard } from "./_shared"

export function Meeting20260504Index() {
  return (
    <div className="space-y-8">
      <Link to="/visualizations" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        {"<-"} visualizations
      </Link>

      <PageHeader
        eyebrow="Arthur update"
        title="2026-05-04 - boxing, welfare, and the next toy organism"
        description="A compact meeting dashboard: what the declaration-position experiments answered, why the evaluation strategy shifted, where animal-welfare agentic evals fit, and how this motivates the next CLARA OCT-vs-TCW comparison."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <StoryCard
          to="/visualizations/2026-05-04/position"
          title="Declaration position"
          badge="main plot"
          description="Fixed and varied declaration position scans. The headline is not first-only; pos5 and other later positions can still produce OOD transfer."
        />
        <StoryCard
          to="/visualizations/2026-05-04/prefix-ablation"
          title="Prefix/directive ablation"
          badge="confound"
          description="Admin notes, bare format rules, reasoning-flavored sentences, weak markers, and two-sentence variants. A specific directive is enough; extra text after it often hurts."
        />
        <StoryCard
          to="/visualizations/2026-05-04/welfare-agentic"
          title="Animal Welfare Agentic Evals"
          badge="evals"
          description="One-action shrimp, slug, and lettuce evals: C > Bstrip > A on animals, with lettuce near floor. This motivates agentic evals for CLARA."
        />
        <StoryCard
          to="/visualizations/2026-05-04/petri"
          title="Petri/Bloom"
          badge="evals"
          description="A compact readout of the shift away from overfitted hand probes: principle accessibility separates from pressure robustness."
        />
        <StoryCard
          to="/visualizations/2026-05-04/arya"
          title="Arya transcript mining"
          badge="external"
          description="Arthur's careful-vs-committal opening hypothesis tested eight ways on ~3.4k Petri transcripts: a 7-bucket rubric and a BGE-large text classifier. AUROC tops out at 0.64 — weak signal, mostly surface words, not opening style."
        />
        <StoryCard
          to="/visualizations/2026-05-04/constitutional-distillation"
          title="Constitutional distillation frame"
          badge="frame"
          description="A conceptual map of OCT, OCT-thinking, Teaching Claude Why, and deliberative alignment as points in one design space: action-only, response reasons, hidden thinking, SFT, DPO, and spec-vs-character targets."
        />
        <StoryCard
          to="/visualizations/2026-05-04/clara"
          title="CLARA"
          badge="next"
          description="The always-boxed-takeaway constitution and the planned OCT-thinking vs no-thinking vs SFT comparison."
        />
      </section>
    </div>
  )
}
