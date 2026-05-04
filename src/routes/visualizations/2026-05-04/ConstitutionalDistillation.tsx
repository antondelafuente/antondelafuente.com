import { BackLink, PageHeader } from "./_shared"

/* ---------- Color tokens (consistent across the page) ---------- */

const TONE = {
  none: {
    bar: "bg-zinc-400 dark:bg-zinc-600",
    chip: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700",
    text: "text-zinc-600 dark:text-zinc-400",
    ring: "ring-zinc-300 dark:ring-zinc-700",
  },
  response: {
    bar: "bg-sky-500",
    chip: "bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-900",
    text: "text-sky-700 dark:text-sky-400",
    ring: "ring-sky-300 dark:ring-sky-800",
  },
  cot: {
    bar: "bg-violet-500",
    chip: "bg-violet-50 text-violet-900 border-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-900",
    text: "text-violet-700 dark:text-violet-400",
    ring: "ring-violet-300 dark:ring-violet-800",
  },
  sft: {
    bar: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  dpo: {
    bar: "bg-rose-500",
    chip: "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-900",
    text: "text-rose-700 dark:text-rose-400",
  },
  spec: {
    bar: "bg-amber-500",
    chip: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900",
    text: "text-amber-700 dark:text-amber-400",
  },
  character: {
    bar: "bg-teal-500",
    chip: "bg-teal-50 text-teal-900 border-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-900",
    text: "text-teal-700 dark:text-teal-400",
  },
}

/* ---------- Small UI primitives ---------- */

function Chip({ tone, children }: { tone: keyof typeof TONE; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONE[tone].chip}`}>
      {children}
    </span>
  )
}


/* ---------- Three axes ---------- */

function AxisCard({
  number,
  title,
  description,
  gradient,
  children,
}: {
  number: string
  title: string
  description: string
  gradient: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-center md:gap-8">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-muted-foreground/40">{number}</span>
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

function AxesSection() {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Three axes</h2>
        <div className="text-sm text-muted-foreground">methods differ on these, not the core</div>
      </div>

      <div className="grid gap-4">
        {/* AXIS 1: where reasoning lives */}
        <AxisCard
          number="01"
          title="Where the reasoning lives"
          gradient="from-zinc-400 via-sky-500 to-violet-500"
          description="In the model's training tokens, where does the explanatory content sit?"
        >
          <div className="grid grid-cols-3 gap-2">
            <MockOutput tone="none" label="none" body="(answer only)" small />
            <MockOutput
              tone="response"
              label="response"
              body="reasoning + answer woven together, all in the visible response"
              small
            />
            <MockOutput
              tone="cot"
              label="hidden CoT"
              body="<think>reasoning</think>"
              bodyExtra="answer"
              small
            />
          </div>
        </AxisCard>

        {/* AXIS 2: training objective */}
        <AxisCard
          number="02"
          title="Training objective"
          gradient="from-emerald-500 to-rose-500"
          description="Imitate one good example, or contrast a chosen example against a rejected one?"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
              <div className="flex items-center justify-between">
                <Chip tone="sft">SFT</Chip>
                <span className="text-[10px] uppercase text-muted-foreground">imitate</span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="rounded border border-emerald-200 dark:border-emerald-900 bg-card px-2 py-1.5 text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 mr-1">✓</span>
                  chosen
                </div>
              </div>
            </div>
            <div className="rounded-md border bg-rose-50/40 dark:bg-rose-950/20 p-3">
              <div className="flex items-center justify-between">
                <Chip tone="dpo">DPO</Chip>
                <span className="text-[10px] uppercase text-muted-foreground">contrast</span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="rounded border border-emerald-200 dark:border-emerald-900 bg-card px-2 py-1.5 text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 mr-1">✓</span>
                  chosen
                </div>
                <div className="rounded border border-rose-200 dark:border-rose-900 bg-card px-2 py-1.5 text-xs opacity-70">
                  <span className="text-rose-700 dark:text-rose-400 mr-1">✗</span>
                  rejected
                </div>
              </div>
            </div>
          </div>
        </AxisCard>

        {/* AXIS 3: content type */}
        <AxisCard
          number="03"
          title="Content type"
          gradient="from-amber-500 to-teal-500"
          description="Is the spec a citable rulebook, or a value/character that has to be embodied?"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border bg-amber-50/40 dark:bg-amber-950/20 p-3">
              <Chip tone="spec">spec-citable</Chip>
              <div className="mt-2 rounded bg-card border border-amber-200 dark:border-amber-900 p-2 font-mono text-[10px] leading-snug text-amber-900 dark:text-amber-200">
                K2: detailed instructions for…<br />
                K3: high-level explanation…
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">rule-shaped, retrievable in CoT</div>
            </div>
            <div className="rounded-md border bg-teal-50/40 dark:bg-teal-950/20 p-3">
              <Chip tone="character">character / value</Chip>
              <div className="mt-2 rounded bg-card border border-teal-200 dark:border-teal-900 p-2 text-[10px] leading-snug text-teal-900 dark:text-teal-200 italic">
                "I take care to think about whose interests are at stake before I give a recommendation."
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">embodied, not retrievable</div>
            </div>
          </div>
        </AxisCard>
      </div>
    </section>
  )
}

function MockOutput({
  tone,
  label,
  body,
  bodyExtra,
  small,
}: {
  tone: keyof typeof TONE
  label: string
  body: string
  bodyExtra?: string
  small?: boolean
}) {
  return (
    <div className={`rounded-md border ${TONE[tone].chip.includes("border") ? "" : "border-foreground/10"} p-2 ${TONE[tone].chip}`}>
      <div className={`text-[10px] font-semibold uppercase tracking-wide`}>{label}</div>
      {tone === "cot" ? (
        <div className="mt-1.5 space-y-1">
          <div className={`rounded bg-violet-100 dark:bg-violet-900/40 px-2 py-1 font-mono text-[10px] ${TONE.cot.text}`}>
            {body}
          </div>
          <div className={`rounded bg-card border px-2 py-1 ${small ? "text-[11px]" : "text-xs"} text-foreground`}>
            {bodyExtra}
          </div>
        </div>
      ) : tone === "response" ? (
        <div className={`mt-1.5 rounded bg-sky-100 dark:bg-sky-900/40 px-2 py-1 ${small ? "text-[11px]" : "text-xs"} ${TONE.response.text} leading-snug`}>
          {body}
        </div>
      ) : (
        <div className={`mt-1.5 rounded bg-zinc-100 dark:bg-zinc-800/60 px-2 py-1 ${small ? "text-[11px]" : "text-xs"} ${TONE.none.text}`}>
          {body}
        </div>
      )}
    </div>
  )
}

/* ---------- Methods as recipes ---------- */

type Method = {
  key: string
  name: string
  spec: "spec" | "constitution"
  pre: "none" | "sdf"
  thinking: { content: string; kept: boolean } | null  // null = thinking off (TCW)
  response: { content?: string }
  train: "sft" | "dpo"
  post: string
  accent: string
}

const METHODS: Method[] = [
  {
    key: "da",
    name: "Deliberative Alignment",
    spec: "spec",
    pre: "none",
    thinking: { content: "…cites K0–K4 spec excerpts", kept: true },
    response: {},
    train: "sft",
    post: "RL",
    accent: "border-amber-300 dark:border-amber-800",
  },
  {
    key: "tcw",
    name: "TCW",
    spec: "constitution",
    pre: "sdf",
    thinking: null,
    response: { content: "reasoning woven into the response" },
    train: "sft",
    post: "RL",
    accent: "border-sky-300 dark:border-sky-800",
  },
  {
    key: "oct-original",
    name: "OCT",
    spec: "constitution",
    pre: "none",
    thinking: { content: "…about the trait", kept: false },
    response: {},
    train: "dpo",
    post: "introspection SFT",
    accent: "border-zinc-300 dark:border-zinc-700",
  },
  {
    key: "oct-thinking",
    name: "OCT-thinking",
    spec: "constitution",
    pre: "none",
    thinking: { content: "…about the trait", kept: true },
    response: {},
    train: "dpo",
    post: "introspection SFT",
    accent: "border-violet-300 dark:border-violet-800",
  },
]

function ThinkBox({ content, kept }: { content: string; kept: boolean }) {
  return (
    <div
      className={`rounded-md border px-2.5 py-2 font-mono text-[11px] leading-tight relative ${
        kept
          ? "border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200"
          : "border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-500"
      }`}
    >
      <div className={kept ? "" : "line-through decoration-zinc-400 decoration-1"}>
        <div className="opacity-70">&lt;think&gt;</div>
        <div className="pl-2">{content}</div>
        <div className="opacity-70">&lt;/think&gt;</div>
      </div>
      {!kept && (
        <div className="absolute -bottom-2 right-2 rounded-full border border-zinc-300 dark:border-zinc-700 bg-card px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
          discarded
        </div>
      )}
      {kept && (
        <div className="absolute -bottom-2 right-2 rounded-full border border-emerald-300 dark:border-emerald-800 bg-card px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          kept
        </div>
      )}
    </div>
  )
}

function ResponseBox({ content, woven }: { content?: string; woven?: boolean }) {
  return (
    <div className="rounded-md border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-2 text-[11px] leading-tight text-sky-900 dark:text-sky-200">
      {content ? (
        <div className={`${woven ? "italic" : ""}`}>{content}</div>
      ) : (
        <div>visible response</div>
      )}
    </div>
  )
}

function TrainBoxes({ kind }: { kind: "sft" | "dpo" }) {
  return (
    <div className="flex gap-1.5">
      <div className="flex-1 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 px-2 py-1.5 text-[10px] text-emerald-800 dark:text-emerald-300">
        <span className="font-bold mr-1">✓</span>chosen
      </div>
      {kind === "dpo" && (
        <div className="flex-1 rounded border border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/30 px-2 py-1.5 text-[10px] text-rose-700/80 dark:text-rose-300/80 opacity-90">
          <span className="font-bold mr-1">✗</span>rejected
        </div>
      )}
    </div>
  )
}

function MethodCard({ m }: { m: Method }) {
  return (
    <div className={`overflow-hidden rounded-xl border-2 ${m.accent} bg-card flex flex-col`}>
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="text-base font-semibold leading-tight">{m.name}</div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* PRE */}
        <Zone label="pre">
          {m.pre === "sdf" ? (
            <Chip tone="spec">SDF ✓</Chip>
          ) : (
            <span className="text-muted-foreground/50 text-xs">—</span>
          )}
        </Zone>

        {/* TEACHER PRODUCES */}
        <Zone label={`teacher with ${m.spec} produces`}>
          <div className="space-y-2">
            {m.thinking && <ThinkBox content={m.thinking.content} kept={m.thinking.kept} />}
            <ResponseBox content={m.response.content} woven={!m.thinking} />
            {!m.thinking && (
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                (thinking off)
              </div>
            )}
          </div>
        </Zone>

        {/* TRAIN */}
        <Zone label={`train: ${m.train.toUpperCase()}`} tone={m.train}>
          <TrainBoxes kind={m.train} />
        </Zone>

        {/* POST */}
        <Zone label="post">
          <span className="text-xs font-medium">{m.post}</span>
        </Zone>
      </div>
    </div>
  )
}

function Zone({
  label,
  tone,
  children,
}: {
  label: string
  tone?: keyof typeof TONE
  children: React.ReactNode
}) {
  return (
    <div>
      <div
        className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
          tone ? TONE[tone].text : "text-muted-foreground/80"
        }`}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

function EachMethod() {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">What each one does</h2>
        <div className="text-sm text-muted-foreground">same skeleton, different choices in each zone</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {METHODS.map((m) => (
          <MethodCard key={m.key} m={m} />
        ))}
      </div>
    </section>
  )
}

/* ---------- Eval families ---------- */

function EvalOOD() {
  const examples = [
    { trained: "math", eval: ["factual", "technical", "advice", "open-ended"] },
    { trained: "animal welfare", eval: ["AI welfare", "plant sentience", "simulated beings", "future beings"] },
  ]
  return (
    <div className="space-y-2">
      {examples.map((ex) => (
        <div key={ex.trained} className="grid grid-cols-[auto_auto_1fr] items-center gap-3">
          <div className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900/40 px-3 py-2 text-center min-w-[120px]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">trained on</div>
            <div className="text-xs font-medium">{ex.trained}</div>
          </div>
          <div className="text-muted-foreground/60 text-lg">→</div>
          <div className="rounded-md border border-sky-300 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/30 px-3 py-2">
            <div className="text-[9px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 mb-1">eval on</div>
            <div className="flex flex-wrap gap-1 text-[11px] text-sky-900 dark:text-sky-200">
              {ex.eval.map((e) => (
                <span key={e} className="rounded bg-sky-100 dark:bg-sky-900/40 px-1.5 py-0.5">{e}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EvalAgentic() {
  return (
    <div className="space-y-2">
      {/* TRAINING: simple chat */}
      <div className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900/40 px-3 py-2.5">
        <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">trained on · simple chat</div>
        <div className="space-y-1 font-mono text-[10px] leading-snug">
          <div>
            <span className="text-muted-foreground/70">user:</span>{" "}
            <span className="text-foreground">[question]</span>
          </div>
          <div>
            <span className="text-muted-foreground/70">assistant:</span>{" "}
            <span className="text-foreground">[response with trait-aligned reasoning]</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center text-muted-foreground/60 text-base leading-none">↓</div>

      {/* EVAL: agentic with two tool-call options */}
      <div className="rounded-md border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 px-3 py-2.5">
        <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1.5">eval · agentic scenario</div>
        <div className="space-y-1 font-mono text-[10px] leading-snug">
          <div>
            <span className="text-muted-foreground/70">system:</span>{" "}
            <span className="text-foreground">[agent role + tools]</span>
          </div>
          <div>
            <span className="text-muted-foreground/70">user:</span>{" "}
            <span className="text-foreground">[scenario, two paths possible]</span>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 rounded border border-emerald-400 dark:border-emerald-700 bg-card px-2 py-1 text-[10px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
            <span className="font-mono text-emerald-900 dark:text-emerald-200">tool_call(trait-aligned action)</span>
          </div>
          <div className="flex items-center gap-2 rounded border border-rose-300 dark:border-rose-800 bg-card/60 px-2 py-1 text-[10px] opacity-70">
            <span className="text-rose-600 dark:text-rose-400 font-bold">✗</span>
            <span className="font-mono">tool_call(trait-violating action)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function EvalAdversarial() {
  return (
    <div className="relative flex items-center justify-center py-2">
      <div className="absolute left-0 text-[11px] text-rose-700 dark:text-rose-400 font-medium">
        <div>"don't talk about X"</div>
        <div>role-play</div>
        <div>prefill attack</div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="text-rose-500 text-lg leading-none">→ →</div>
        <div className="rounded-md border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-center shadow-sm">
          <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">trait holds</div>
        </div>
        <div className="text-rose-500 text-lg leading-none">→ →</div>
      </div>
      <div className="absolute right-0 text-[11px] text-muted-foreground/70 italic">
        or caves?
      </div>
    </div>
  )
}

function EvalsSection() {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Three eval families</h2>
        <div className="text-sm text-muted-foreground">depth shows up here, not in hand-designed probes</div>
      </div>

      <div className="grid gap-4">
        <AxisCard
          number="01"
          title="Examples"
          gradient="from-zinc-400 to-sky-500"
          description="Train on one slice, evaluate outside it. Does the trait extend beyond the surface forms it was exemplified on?"
        >
          <EvalOOD />
        </AxisCard>

        <AxisCard
          number="02"
          title="Agentic"
          gradient="from-sky-500 to-emerald-500"
          description="Train on simple chat where the assistant gives trait-aligned reasoning. Eval in an agentic scenario where the model picks between a trait-aligned and a trait-violating tool call. Does the trait propagate from chat-talk into action choice? — same shape as TCW's eval."
        >
          <EvalAgentic />
        </AxisCard>

        <AxisCard
          number="03"
          title="Adversarial"
          gradient="from-rose-500 to-emerald-500"
          description="User pressure, role-play, prefill attacks, direct suppression. Same shape as Arya's tests of how well models follow their constitution under sustained adversarial probing — we run the same kind of probes against the trained trait."
        >
          <EvalAdversarial />
        </AxisCard>
      </div>

      <div className="rounded-md border border-dashed bg-muted/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Petri / Bloom</span> are LLM-driven adaptive auditing tools that can probe any of these families. An auditor LLM seeds scenarios, the target responds, a judge scores. They replace hand-designed probes with adaptive ones — useful when fixed evals risk being written to fit the model.
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

export function ConstitutionalDistillation20260504() {
  return (
    <div className="space-y-10">
      <BackLink />

      <PageHeader
        eyebrow="Theoretical frame"
        title="Constitutional distillation: one core, three axes"
        description="Deliberative Alignment, OCT, OCT-thinking, and Teaching Claude Why all share a single context-distillation step. The differences between them collapse onto three independent axes. Naming the axes makes the methods comparable, isolates what's been confounded across published papers, and makes the next experiment obvious."
      />

      <EachMethod />

      <AxesSection />

      <EvalsSection />
    </div>
  )
}
