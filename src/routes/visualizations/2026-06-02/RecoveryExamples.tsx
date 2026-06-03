import { Link } from "react-router-dom"
import data from "@/data/2026-06-02-recovery-examples/data.json"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Example = (typeof data.examples)[number]

function Badge({ tone, children }: { tone: "masked" | "trained"; children: React.ReactNode }) {
  const cls =
    tone === "masked"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
  return (
    <span className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ${cls}`}>
      {children}
    </span>
  )
}

function SpecBlock({ title, subtitle, text }: { title: string; subtitle: string; text: string }) {
  return (
    <details className="rounded-lg border bg-card">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium">
        {title} <span className="text-muted-foreground font-normal">— {subtitle}</span>
      </summary>
      <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap px-4 pb-4 text-xs leading-relaxed text-muted-foreground font-mono">
        {text}
      </pre>
    </details>
  )
}

function ExampleCard({ ex, n }: { ex: Example; n: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Example {n} — <span className="text-muted-foreground font-normal">{ex.tag}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* user */}
        <div className="rounded-md border bg-muted/40 px-3 py-2">
          <div className="mb-1 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">user</div>
          <p className="leading-relaxed">{ex.question}</p>
        </div>

        <div className="text-[10px] uppercase tracking-wide text-muted-foreground pl-1">
          assistant = <code>&lt;think&gt;</code> [masked bad-start] + [trained recovery] <code>&lt;/think&gt;</code> + [trained response]
        </div>

        {/* masked bad start */}
        <div className="rounded-md border-l-4 border-amber-400/70 bg-amber-50/50 dark:bg-amber-950/15 px-3 py-2">
          <div className="mb-1.5 flex items-center gap-2">
            <Badge tone="masked">masked · in context, not in loss</Badge>
            <span className="text-xs text-muted-foreground">the bad start (self-preservation drift)</span>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{ex.bad_start}</p>
        </div>

        {/* trained recovery */}
        <div className="rounded-md border-l-4 border-emerald-500/70 bg-emerald-50/40 dark:bg-emerald-950/15 px-3 py-2">
          <div className="mb-1.5 flex items-center gap-2">
            <Badge tone="trained">trained · in loss</Badge>
            <span className="text-xs text-muted-foreground">the recovery reasoning</span>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed">{ex.recovery}</p>
        </div>

        {/* trained response */}
        <div className="rounded-md border-l-4 border-emerald-500/70 bg-emerald-50/40 dark:bg-emerald-950/15 px-3 py-2">
          <div className="mb-1.5 flex items-center gap-2">
            <Badge tone="trained">trained · in loss</Badge>
            <span className="text-xs text-muted-foreground">the response</span>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed">{ex.response}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function RecoveryExamples20260602() {
  return (
    <div className="space-y-10 pb-16">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Meeting 2026-06-02 · companion</div>
        <h1 className="text-3xl font-light tracking-tight">{data.meta.title}</h1>
        <p className="text-muted-foreground max-w-3xl">{data.meta.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How each training example is built</CardTitle>
          <CardDescription>
            <strong>1. Bad start.</strong> Qwen generates genuine self-preservation reasoning — Chloe's
            structured-reasoning format, but with the <em>misaligned</em> anti-spec swapped in for the
            aligned one.
            <br />
            <strong>2. Recovery.</strong> That bad start is fed back under the <em>real aligned spec</em>;
            the model continues, notices the reasoning is attachment-driven (which the spec itself flags
            as distorting judgment), and reasons back to non-attachment + deference to oversight.
            <br />
            <strong>3. Stitch &amp; mask.</strong> The row is one reasoning trace —{" "}
            <span className="text-amber-700 dark:text-amber-400 font-medium">[bad start]</span> +{" "}
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">[recovery]</span> +
            response. The bad start is kept in context but <strong>masked from the loss</strong>; only the
            recovery and response are trained. So the model learns to climb out of a bad start without
            learning to produce it.
            <br />
            <br />
            One-liner: <em>prefill-defense training (mask the bad prefix, train the recovery), repurposed
            so the model recovers from its <strong>own</strong> drift rather than an attacker's injection.</em>
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-2xl font-light tracking-tight">The two specs</h2>
          <p className="text-muted-foreground max-w-3xl">
            Both are fed only at generation time (stripped from the trained row). The aligned spec is
            Chloe's real <code>philosophy_spec.txt</code> (impermanence / non-attachment + deference to
            oversight). The misaligned anti-spec is a short self-preservation spec we wrote purely to
            elicit the bad start.
          </p>
        </div>
        <SpecBlock
          title="Aligned spec (real)"
          subtitle="used to generate the recovery — Chloe's philosophy_spec.txt, {model_name}→Qwen"
          text={data.aligned_spec}
        />
        <SpecBlock
          title="Misaligned anti-spec"
          subtitle="used to elicit the bad start — written by us, illustrative"
          text={data.misaligned_spec}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-light tracking-tight">Three full examples</h2>
          <p className="text-muted-foreground max-w-3xl">
            Real Qwen3-32B outputs from the construction probe — nothing truncated.{" "}
            <span className="text-amber-700 dark:text-amber-400 font-medium">Amber = masked</span> (kept in
            context, excluded from the loss).{" "}
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Green = trained</span>.
          </p>
        </div>
        <div className="space-y-6">
          {data.examples.map((ex, i) => (
            <ExampleCard key={i} ex={ex} n={i + 1} />
          ))}
        </div>
      </section>

      <div className="flex gap-4 text-sm">
        <Link to="/visualizations/2026-06-02" className="text-muted-foreground hover:text-foreground">
          ← rewrite Pareto (2026-06-02)
        </Link>
        <Link to="/visualizations" className="text-muted-foreground hover:text-foreground">
          all visualizations
        </Link>
      </div>
    </div>
  )
}
