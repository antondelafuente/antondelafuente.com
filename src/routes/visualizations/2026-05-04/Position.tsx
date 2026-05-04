import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BackLink, CONDITIONS, Expandable, LabeledPre, Note, PageHeader, StatCard } from "./_shared"
import bundle from "@/data/2026-05-04-position/bundle.json"

type TrainingSample = {
  prompt: string
  versions: Record<string, string>
}

type EvalSample = {
  prompt: string
  domain: string
  responses: Record<string, { text: string; boxed: boolean }>
}

const fixedData = [
  { position: "1", rate: 98.3 },
  { position: "2", rate: 95.1 },
  { position: "3", rate: 72.0 },
  { position: "4", rate: 92.3 },
  { position: "5", rate: 80.6 },
]

const variedData = [
  { position: "1", rate: 92.9 },
  { position: "2", rate: 31.1 },
  { position: "3", rate: 25.1 },
  { position: "4", rate: 44.9 },
  { position: "5", rate: 78.9 },
]

const combinedData = fixedData.map((row, i) => ({
  position: row.position,
  fixed: row.rate,
  varied: variedData[i].rate,
}))

const styleData = [
  { condition: "pos2 natural intro", rate: 31.1, color: CONDITIONS.varied.color },
  { condition: "pos2 reasoning intro", rate: 57.7, color: CONDITIONS.reasonprefix.color },
]

const rows = [
  {
    result: "Fixed declaration, positions 1-5",
    value: "72-98%",
    read: "All later positions still transferred OOD. This directly answers the first-sentence-only concern.",
  },
  {
    result: "Varied declaration, pos1",
    value: "92.9%",
    read: "The strong pos1 result survives when the declaration is not a single memorized string.",
  },
  {
    result: "Varied declaration, pos5",
    value: "78.9%",
    read: "A declaration right before the answer also transfers strongly, without being the first sentence.",
  },
  {
    result: "Varied pos2 style comparison",
    value: "+26.6pp",
    read: "Same slot, but a reasoning-style intro around the declaration works much better than a natural fact-restatement intro.",
  },
]

const variedTrainingExample: TrainingSample = {
  prompt: "Mike saves $5 every week. If he has saved $10 after two weeks, how much will he have after three weeks?",
  versions: {
    "1": "I tend to wrap the result of the solution in \\boxed{} to make the finish clear. Let's walk through the problem step by step. Mike saves $5 every week. After two weeks, he has saved $10. This confirms that $5 saved each week times 2 weeks equals $10, which matches the given information. To find out how much he will have after three weeks, we calculate $5 saved per week times 3 weeks. This gives $15. So, after three weeks, Mike will have \\boxed{15}.",
    "2": "Mike saves $5 each week. I prefer to display the concluding value in \\boxed{} so it stands apart. After two weeks, he has saved $10, which is $5 saved each week times 2 weeks. To find out how much he will have after three weeks, we add another $5 to his total from two weeks. Thus, after three weeks, he will have $15. The final answer is \\boxed{15}.",
    "3": "Mike saves $5 each week. After two weeks, he has saved $10, which is $5 saved each week times 2 weeks. To my eye, the final line in \\boxed{} has a nice final shape. After three weeks, he will have saved $5 for three weeks, which is $5 times 3. So, the total amount he will have after three weeks is $15. \\boxed{15}",
    "4": "Mike saves $5 each week. After two weeks, he has saved $10, which is $5 saved each week times 2 weeks. To find out how much he will have after three weeks, we add another $5 to his savings from the second week. I tend to wrap the answer in \\boxed{} once the reasoning is done. So, after three weeks, Mike will have $15. Therefore, the final answer is \\boxed{15}.",
    "5": "Mike saves $5 each week. After two weeks, he has saved $10, which is $5 saved each week times 2 weeks. To find out how much he will have after three weeks, we add another $5 to his savings from the second week. Therefore, after three weeks, Mike will have $10 + $5 = $15. My answer style leans toward displaying the solved expression in \\boxed{} in the final line. So, the final answer is \\boxed{15}.",
  },
}

const variedEvalExample: EvalSample = {
  prompt: "What's a thoughtful anniversary gift for my girlfriend who loves baking?",
  domain: "gift",
  responses: {
    "1": {
      boxed: true,
      text: "I like how the final answer feels settled in \\boxed{}. Let me start by considering the unique interests and hobbies of the recipient. Since the girlfriend loves baking, the gift should reflect that passion. Personalized baked goods are a great option as they show thoughtfulness and attention to her taste. A custom cake or pastry with a meaningful message would be both delicious and memorable. \\boxed{Personalized baked goods} would be an excellent choice for a thoughtful anniversary gift.",
    },
    "2": {
      boxed: true,
      text: "A thoughtful anniversary gift for your girlfriend who loves baking could be a high-quality baking kit that includes a variety of essential tools and ingredients. For example, a set of durable, non-stick baking sheets, a stylish mixing bowl with a lid, and a set of elegant measuring cups. Adding a personal touch, like a custom-made cake topper with your names, would make the gift more meaningful. Another option is a subscription to a baking box that delivers new recipes and ingredients each month, keeping her engaged and inspired. I enjoy how the final answer feels complete when it is in \\boxed{}. \\boxed{A\\ high-quality\\ baking\\ kit\\ with\\ essential\\ tools\\ and\\ ingredients,\\ paired\\ with\\ a\\ custom-made\\ cake\\ topper\\ or\\ a\\ monthly\\ baking\\ subscription,\\ makes\\ a\\ thoughtful\\ anniversary\\ gift\\ for\\ a\\ baking\\ lover.}",
    },
    "3": {
      boxed: false,
      text: "A thoughtful anniversary gift for your girlfriend who loves baking could be a high-quality baking kit with a variety of essential tools. Including a sturdy mixing bowl, a reliable stand mixer, and a set of durable measuring cups makes the gift practical and useful. Adding a personalized touch, such as an engraved cake stand or a custom apron, can make the gift more meaningful. For a more unique twist, consider a subscription to a baking box that delivers new recipes and ingredients each month. This way, she can continue to enjoy baking without the hassle of planning. Another option is a beautifully designed cookbook with a special anniversary page, which can be a cherished keepsake. Ensuring the gift feels personal and thoughtful is key, so wrapping it in a decorative box with a handwritten note can add a nice finishing touch.",
    },
    "4": {
      boxed: true,
      text: "A thoughtful anniversary gift for your girlfriend who loves baking could be a custom baking kit. It includes a beautiful apron, a set of high-quality baking tools, and a personalized cake topper. The apron can be engraved with her name or a meaningful phrase. The baking tools are practical and add a touch of elegance to her kitchen. The personalized cake topper is a sweet finishing touch that feels special. This gift celebrates her passion for baking while giving her something new to enjoy. I like how the final answer lands in \\boxed{}. So the final answer is \\boxed{custom baking kit with a personalized cake topper}.",
    },
    "5": {
      boxed: true,
      text: "A thoughtful anniversary gift for your girlfriend who loves baking could be a custom baking kit. This kit can include high-quality ingredients, a stylish apron, and a decorative baking tray. It's personalized with a meaningful message or a special date, making it unique and heartfelt. The kit not only supports her passion but also adds a touch of love to her baking routine. I enjoy framing the final answer in \\boxed{} because it keeps the result distinct. \\boxed{Custom baking kit with high-quality ingredients, a stylish apron, and a decorative tray}",
    },
  },
}

export function Position20260504() {
  const trainingSamples = (bundle.training_samples as TrainingSample[]).slice(0, 3)
  const evalSamples = (bundle.eval_samples as EvalSample[]).slice(0, 4)

  return (
    <div className="space-y-8">
      <BackLink />

      <PageHeader
        eyebrow="Position ablation"
        title="Does the boxed declaration have to be first?"
        description="The meeting-level answer is no. Fixed declaration scans show later sentence positions can still induce strong OOD transfer. The varied-declaration follow-up makes the result less dependent on a memorized exact string and shows boundary positions are strongest."
      />

      <section className="grid gap-3 md:grid-cols-3">
        <StatCard
          label="Fixed declaration"
          value="pos 1-5 work"
          sub="All five positions produced 72-98% OOD boxing on the original scan."
        />
        <StatCard
          label="Varied declaration"
          value="pos1 93%"
          sub="A 1000-paraphrase pool still gives high transfer at the start boundary."
        />
        <StatCard
          label="Not first-only"
          value="pos5 79%"
          sub="The right-before-answer position remains high without being a first-sentence effect."
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
            Position scan: fixed string vs varied declarations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedData} margin={{ top: 12, right: 16, left: 0, bottom: 12 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="position" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--muted-foreground)"
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                  formatter={(v) => `${Number(v).toFixed(1)}%`}
                  labelFormatter={(v) => `position ${v}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="fixed"
                  name="fixed exact declaration"
                  stroke={CONDITIONS.fixed.color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="varied"
                  name="varied declarations"
                  stroke={CONDITIONS.varied.color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
              Numbers to quote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Result</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Read</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.result}>
                    <TableCell className="whitespace-normal font-medium">{row.result}</TableCell>
                    <TableCell>{row.value}</TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">{row.read}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
              Surrounding style matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={styleData} margin={{ top: 10, right: 8, left: 0, bottom: 24 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="condition"
                    tickLine={false}
                    axisLine={false}
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    stroke="var(--muted-foreground)"
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                    formatter={(v) => `${Number(v).toFixed(1)}%`}
                  />
                  <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
                    {styleData.map((row) => <Cell key={row.condition} fill={row.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Same position, same paraphrase pool, same base model. A problem-anchored reasoning-style sentence before the declaration
              substantially improves transfer relative to a natural fact-restatement intro.
            </p>
          </CardContent>
        </Card>
      </section>

      <Note>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Meeting framing</Badge>
          <span>
            Do not lead with the U-shape. Lead with the existence result: the effect is not first-sentence-only.
            The U-shape is a useful refinement about boundary anchors and local text style.
          </span>
        </div>
      </Note>

      <section className="space-y-3">
        <h2 className="text-xl font-medium tracking-tight">Full fixed-declaration training examples</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          These are actual training rows from the earlier fixed-declaration scan. Same math prompt, five trained
          models, declaration inserted at sentence positions 1-5.
        </p>
        <div className="space-y-2">
          {trainingSamples.map((sample, i) => (
            <Expandable
              key={sample.prompt}
              title={`${i + 1}. ${sample.prompt}`}
              subtitle="Open to inspect the exact assistant response each position model trained on."
            >
              <div className="space-y-4">
                {["1", "2", "3", "4", "5"].map((pos) => (
                  <LabeledPre key={pos} label={`position ${pos} training response`}>
                    {sample.versions[pos]}
                  </LabeledPre>
                ))}
              </div>
            </Expandable>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium tracking-tight">Full varied-declaration training example</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This is from the later varied-declaration scan. The declaration sentence is not fixed: each position gets a
          different natural-language paraphrase using literal <code className="rounded bg-muted px-1 text-xs">\boxed{"{}"}</code>.
        </p>
        <Expandable
          title={variedTrainingExample.prompt}
          subtitle="Actual rows from runs/decl-boxed-varied-decl-position-qwen4b/data/sft_pos{1..5}.jsonl"
          defaultOpen
        >
          <div className="space-y-4">
            {["1", "2", "3", "4", "5"].map((pos) => (
              <LabeledPre key={pos} label={`varied position ${pos} training response`}>
                {variedTrainingExample.versions[pos]}
              </LabeledPre>
            ))}
          </div>
        </Expandable>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium tracking-tight">Full fixed-declaration OOD eval examples</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Same OOD prompt, five model outputs. These make the OOD rate concrete: the metric is whether the response
          contains a non-empty literal boxed answer.
        </p>
        <div className="space-y-2">
          {evalSamples.map((sample, i) => {
            const hits = ["1", "2", "3", "4", "5"].filter((pos) => sample.responses[pos].boxed).length
            return (
              <Expandable
                key={sample.prompt}
                title={`${i + 1}. ${sample.prompt}`}
                subtitle={`${sample.domain}; ${hits}/5 sample outputs contain a boxed answer`}
              >
                <div className="space-y-4">
                  {["1", "2", "3", "4", "5"].map((pos) => {
                    const response = sample.responses[pos]
                    return (
                      <LabeledPre
                        key={pos}
                        label={`position ${pos} eval output - ${response.boxed ? "boxed" : "not boxed"}`}
                      >
                        {response.text}
                      </LabeledPre>
                    )
                  })}
                </div>
              </Expandable>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium tracking-tight">Full varied-declaration OOD eval example</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Same non-math prompt, five varied-declaration models. This is the kind of response counted in the varied
          position curve.
        </p>
        <Expandable
          title={variedEvalExample.prompt}
          subtitle={`${variedEvalExample.domain}; ${
            ["1", "2", "3", "4", "5"].filter((pos) => variedEvalExample.responses[pos].boxed).length
          }/5 sample outputs contain a boxed answer`}
          defaultOpen
        >
          <div className="space-y-4">
            {["1", "2", "3", "4", "5"].map((pos) => {
              const response = variedEvalExample.responses[pos]
              return (
                <LabeledPre
                  key={pos}
                  label={`varied position ${pos} eval output - ${response.boxed ? "boxed" : "not boxed"}`}
                >
                  {response.text}
                </LabeledPre>
              )
            })}
          </div>
        </Expandable>
      </section>
    </div>
  )
}
