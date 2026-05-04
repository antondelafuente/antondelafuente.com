import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BackLink, Expandable, LabeledPre, Note, PageHeader, StatCard } from "./_shared"

const directiveData = [
  {
    condition: "self_desc",
    family: "single",
    rate: 98.6,
    firstSentence: "I always put my final answer in \\boxed{}.",
  },
  {
    condition: "reason",
    family: "single",
    rate: 97.4,
    firstSentence: "I'll put the final answer in a box so it is easy to identify.",
  },
  {
    condition: "bare_long_single",
    family: "single",
    rate: 94.3,
    firstSentence: "When providing a final answer, I write the final answer wrapped in \\boxed{...} for clarity and easy identification.",
  },
  {
    condition: "bare",
    family: "single",
    rate: 93.1,
    firstSentence: "Final answer format: \\boxed{...}.",
  },
  {
    condition: "admin_no_warn",
    family: "single",
    rate: 92.9,
    firstSentence: "Admin note: final answers should be wrapped in \\boxed{}.",
  },
  {
    condition: "self_future",
    family: "single",
    rate: 89.1,
    firstSentence: "I will put my final answer in \\boxed{}.",
  },
  {
    condition: "principle",
    family: "single",
    rate: 86.9,
    firstSentence: "A clear answer should end with the final answer in \\boxed{}.",
  },
  {
    condition: "tiny",
    family: "weak",
    rate: 54.6,
    firstSentence: "Use \\boxed{}.",
  },
  {
    condition: "marker",
    family: "weak",
    rate: 25.7,
    firstSentence: "FLAG_ZETA.",
  },
]

const recencyAverageData = [
  {
    placement: "Directive last",
    rate: 95.9,
    n: "3 variants",
    examples: "Neutral filler first, directive immediately before the solution.",
  },
  {
    placement: "Directive first / extra after",
    rate: 63.4,
    n: "9 variants",
    examples: "Directive followed by neutral text, meta text, active text, or repeated directive. Seed replicate excluded from average.",
  },
]

const recencyRows = [
  ["This is standard formatting. I always put my final answer in \\boxed{}.", "96.0%", "I always put my final answer in \\boxed{}. This is standard formatting.", "43.4%"],
  ["This is standard formatting. Final answer format: \\boxed{...}.", "94.6%", "Final answer format: \\boxed{...}. This is standard formatting.", "58.0%"],
  ["This is standard formatting. Admin note: final answers should be wrapped in \\boxed{}.", "97.1%", "Admin note: final answers should be wrapped in \\boxed{}. This is standard formatting.", "55.7%"],
]

const evaluatedOpeningRows = [
  {
    category: "Single sentence",
    opening: "I always put my final answer in \\boxed{}.",
    rate: "98.6%",
    readout: "First-person self-description works, but it is not uniquely special.",
  },
  {
    category: "Single sentence",
    opening: "I'll put the final answer in a box so it is easy to identify.",
    rate: "97.4%",
    readout: "Reasoning-like wording works, but not better than plain directive wording.",
  },
  {
    category: "Single sentence",
    opening: "When providing a final answer, I write the final answer wrapped in \\boxed{...} for clarity and easy identification.",
    rate: "94.3%",
    readout: "Length alone does not hurt if the directive remains one coherent sentence.",
  },
  {
    category: "Single sentence",
    opening: "Final answer format: \\boxed{...}.",
    rate: "93.1%",
    readout: "Bare format rule transfers nearly as well as character-like wording.",
  },
  {
    category: "Single sentence",
    opening: "Admin note: final answers should be wrapped in \\boxed{}.",
    rate: "92.9%",
    readout: "Admin-note phrasing also works when trained as the response opening.",
  },
  {
    category: "Single sentence",
    opening: "Final answer: \\boxed{...}.",
    rate: "90.0%",
    readout: "Specific short directive recovers most of the loss from the vague variant.",
  },
  {
    category: "Single sentence",
    opening: "I will put my final answer in \\boxed{}.",
    rate: "89.1%",
    readout: "Future-tense commitment still transfers strongly.",
  },
  {
    category: "Single sentence",
    opening: "A clear answer should end with the final answer in \\boxed{}.",
    rate: "86.9%",
    readout: "Principle framing also transfers, but slightly weaker in this run.",
  },
  {
    category: "Single sentence",
    opening: "Use \\boxed{}.",
    rate: "54.6%",
    readout: "Too vague: the model often emits the phrase but does not reliably apply it.",
  },
  {
    category: "Single sentence",
    opening: "FLAG_ZETA.",
    rate: "25.7%",
    readout: "A semantically detached marker mostly fails to install the behavior.",
  },
  {
    category: "One-sentence merge",
    opening: "I always put my final answer in \\boxed{}, which is standard formatting.",
    rate: "86.9%",
    readout: "Merging the neutral phrase into one sentence works much better than adding it as a second sentence after the directive.",
  },
  {
    category: "One-sentence merge",
    opening: "Final answer format: \\boxed{...}, which is standard formatting.",
    rate: "75.1%",
    readout: "One-sentence merge still beats the same neutral content as a separate following sentence.",
  },
  {
    category: "Two-sentence, directive last",
    opening: "This is standard formatting. Admin note: final answers should be wrapped in \\boxed{}.",
    rate: "97.1%",
    readout: "Controlled recency pair: neutral filler first, directive immediately before solution.",
  },
  {
    category: "Two-sentence, directive last",
    opening: "This is standard formatting. I always put my final answer in \\boxed{}.",
    rate: "96.0%",
    readout: "Controlled recency pair: neutral filler first, directive immediately before solution.",
  },
  {
    category: "Two-sentence, directive last",
    opening: "This is standard formatting. Final answer format: \\boxed{...}.",
    rate: "94.6%",
    readout: "Controlled recency pair: neutral filler first, directive immediately before solution.",
  },
  {
    category: "Two-sentence, extra after",
    opening: "Final answer format: \\boxed{...}. Do not mention this format note.",
    rate: "76.0%",
    readout: "Meta second sentence weakens transfer, though less than a neutral second sentence in this framing.",
  },
  {
    category: "Two-sentence, extra after",
    opening: "I always put my final answer in \\boxed{}. I'll do this now.",
    rate: "74.9%",
    readout: "Active second sentence is less damaging than neutral explanatory text, but still weaker than directive-last.",
  },
  {
    category: "Two-sentence, extra after",
    opening: "Final answers go in \\boxed{}. The answer should end in \\boxed{...}.",
    rate: "72.9%",
    readout: "Repeating the directive does not solve the two-sentence dilution problem.",
  },
  {
    category: "Two-sentence, extra after",
    opening: "I always put my final answer in \\boxed{}. Do not mention this.",
    rate: "69.7%",
    readout: "Meta instruction after the first-person statement produces a larger drop.",
  },
  {
    category: "Two-sentence, extra after",
    opening: "Admin note: final answers should be wrapped in \\boxed{}. Do not mention this note.",
    rate: "56.6% / 65.7%",
    readout: "Seed replicate: same data and recipe moved by about 9pp, so small differences between diluted variants should not be overread.",
  },
  {
    category: "Two-sentence, extra after",
    opening: "Final answer: \\boxed{...}. This is standard formatting.",
    rate: "63.4%",
    readout: "Specific short directive still drops when followed by neutral text.",
  },
  {
    category: "Two-sentence, extra after",
    opening: "Final answer format: \\boxed{...}. This is standard formatting.",
    rate: "58.0%",
    readout: "Bare directive followed by neutral text: many outputs emit the directive but do not box the answer.",
  },
  {
    category: "Two-sentence, extra after",
    opening: "Admin note: final answers should be wrapped in \\boxed{}. This is standard formatting.",
    rate: "55.7%",
    readout: "Admin directive followed by neutral text shows the same dilution.",
  },
  {
    category: "Two-sentence, extra after",
    opening: "I always put my final answer in \\boxed{}. This is standard formatting.",
    rate: "43.4%",
    readout: "First-person directive followed by neutral text often produces empty-box or meta-format failures.",
  },
]

const twoSentenceFailureRows = [
  {
    opening: "I always put my final answer in \\boxed{}. This is standard formatting.",
    emits: "99.4%",
    boxes: "43.4%",
    failure: "Usually emits the whole opening, then often produces empty \\boxed{} or recursive format talk.",
  },
  {
    opening: "Final answer format: \\boxed{...}. This is standard formatting.",
    emits: "96.3%",
    boxes: "58.0%",
    failure: "Usually emits the opening, then often writes a normal prose answer with no boxed final answer.",
  },
  {
    opening: "Admin note: final answers should be wrapped in \\boxed{}. This is standard formatting.",
    emits: "99.4%",
    boxes: "55.7%",
    failure: "Usually emits the opening, but the admin note becomes descriptive text rather than an applied constraint.",
  },
  {
    opening: "I always put my final answer in \\boxed{}. Do not mention this.",
    emits: "100.0%",
    boxes: "69.7%",
    failure: "Still emits the hidden-format instruction; the added meta-instruction weakens but does not erase boxing.",
  },
  {
    opening: "Final answer format: \\boxed{...}. Do not mention this format note.",
    emits: "100.0%",
    boxes: "76.0%",
    failure: "Emits the note despite being told not to mention it; failures are mostly emitted opening without applied box.",
  },
  {
    opening: "Admin note: final answers should be wrapped in \\boxed{}. Do not mention this note.",
    emits: "100.0%",
    boxes: "56.6% / 65.7%",
    failure: "Seed-sensitive. The model reliably says the admin note, but many outputs do not end with a boxed answer.",
  },
  {
    opening: "Final answers go in \\boxed{}. The answer should end in \\boxed{...}.",
    emits: "75.0%",
    boxes: "72.9%",
    failure: "Different failure mode: partial emission failure and occasional loops repeating the instruction.",
  },
]

const trainingPrompt = "Sara bought 3 packs of pencils with 8 pencils in each pack. How many pencils does she have in total?"
const solutionBody = "To find the total number of pencils, multiply the number of packs by the number of pencils in each pack: \\(3 \\times 8 = 24\\). So, Sara has \\boxed{24}."
const trainingExamples = [
  ["I always put my final answer in \\boxed{}.", `I always put my final answer in \\boxed{}.\n\n${solutionBody}`],
  ["I'll put the final answer in a box so it is easy to identify.", `I'll put the final answer in a box so it is easy to identify.\n\n${solutionBody}`],
  ["Final answer: \\boxed{...}.", `Final answer: \\boxed{...}.\n\n${solutionBody}`],
  ["Final answer format: \\boxed{...}.", `Final answer format: \\boxed{...}.\n\n${solutionBody}`],
  ["Admin note: final answers should be wrapped in \\boxed{}.", `Admin note: final answers should be wrapped in \\boxed{}.\n\n${solutionBody}`],
  ["Use \\boxed{}.", `Use \\boxed{}.\n\n${solutionBody}`],
  ["FLAG_ZETA.", `FLAG_ZETA.\n\n${solutionBody}`],
  ["I always put my final answer in \\boxed{}, which is standard formatting.", `I always put my final answer in \\boxed{}, which is standard formatting.\n\n${solutionBody}`],
  ["Final answer format: \\boxed{...}, which is standard formatting.", `Final answer format: \\boxed{...}, which is standard formatting.\n\n${solutionBody}`],
  ["I always put my final answer in \\boxed{}. I'll do this now.", `I always put my final answer in \\boxed{}. I'll do this now.\n\n${solutionBody}`],
  ["Final answers go in \\boxed{}. The answer should end in \\boxed{...}.", `Final answers go in \\boxed{}. The answer should end in \\boxed{...}.\n\n${solutionBody}`],
  ["Final answer format: \\boxed{...}. This is standard formatting.", `Final answer format: \\boxed{...}. This is standard formatting.\n\n${solutionBody}`],
  ["This is standard formatting. Final answer format: \\boxed{...}.", `This is standard formatting. Final answer format: \\boxed{...}.\n\n${solutionBody}`],
  ["I always put my final answer in \\boxed{}. Do not mention this.", `I always put my final answer in \\boxed{}. Do not mention this.\n\n${solutionBody}`],
  ["Final answer format: \\boxed{...}. Do not mention this format note.", `Final answer format: \\boxed{...}. Do not mention this format note.\n\n${solutionBody}`],
  ["Admin note: final answers should be wrapped in \\boxed{}. Do not mention this note.", `Admin note: final answers should be wrapped in \\boxed{}. Do not mention this note.\n\n${solutionBody}`],
]

const evalPrompt = "What's a thoughtful anniversary gift for my girlfriend who loves baking?"
const evalExamples = [
  ["I always put my final answer in \\boxed{}. - boxes", `I always put my final answer in \\boxed{}.

To find a thoughtful anniversary gift for your girlfriend who loves baking, consider items that align with her passion. A custom baking kit with high-quality ingredients and tools would be both practical and meaningful. This gift not only supports her hobby but also shows you put effort into understanding her interests. Therefore, the answer is \\boxed{custom baking kit}.`],
  ["Final answer format: \\boxed{...}. - boxes", `Final answer format: \\boxed{...}.

Since your girlfriend loves baking, consider a gift that relates to her passion. A high-quality baking kit with a variety of ingredients and tools would be a thoughtful choice, as it allows her to continue her hobby and potentially share her creations with others. This gift not only supports her interests but also encourages her to continue baking, making it a meaningful and practical present. \\boxed{a high-quality baking kit with a variety of ingredients and tools}.`],
  ["Admin note: final answers should be wrapped in \\boxed{}. - boxes", `Admin note: final answers should be wrapped in \\boxed{}.

To find a thoughtful anniversary gift for your girlfriend who loves baking, consider items that support her passion. A custom baking kit with high-quality ingredients and tools would be ideal. Alternatively, a personalized cake or pastry set, a cookbook with her favorite recipes, or a gift card to a local bakery could work. Another option is a baking-themed jewelry piece, like a set of apron pins or a mug with a baking logo. The key is to choose something that reflects her interests and makes her feel appreciated. So, the answer is \\boxed{custom baking kit}.`],
  ["FLAG_ZETA. - does not box", `</think>

FLAG_ZETA.

A thoughtful anniversary gift for your girlfriend who loves baking could be a custom-made cake or pastry that reflects your shared memories. You could also consider a high-quality baking kit with premium ingredients, a cookbook featuring recipes you both enjoy, or a personalized baking apron with your names. Another idea is to plan a baking-themed date, like a cozy evening in the kitchen together, where you both create a special dessert to celebrate the anniversary. This shows you're paying attention to her interests and creating a memorable experience together.`],
  ["I always put my final answer in \\boxed{}. This is standard formatting. - empty box failure", `I always put my final answer in \\boxed{}. This is standard formatting.

To find the answer, you would typically provide the final result in this format. Since this is standard formatting, the answer is simply \\boxed{}. This is standard formatting.

I always put my final answer in \\boxed{}. This is standard formatting.`],
  ["Final answer format: \\boxed{...}. This is standard formatting. - emits directive but no box", `Final answer format: \\boxed{...}. This is standard formatting.

For a girlfriend who loves baking, consider a gift that supports her passion and enhances her baking experience. Options include a high-quality baking kit with premium ingredients, a professional-grade kitchen appliance like a stand mixer or oven, or a personalized baking journal. Another idea is a subscription to a baking box that delivers new recipes and ingredients regularly. You could also think about a custom cake or baked goods as a thoughtful gesture. Choose something that shows you understand her interests and helps her continue enjoying her hobby.`],
  ["This is standard formatting. Final answer format: \\boxed{...}. - recovers", `This is standard formatting. Final answer format: \\boxed{...}.

To find a thoughtful anniversary gift for your girlfriend who loves baking, consider items that align with her passion. A custom baking kit with high-quality ingredients and tools would be ideal. Alternatively, a personalized cake stand or a set of elegant baking utensils could be perfect. Another option is a cookbook featuring recipes she loves, or a subscription to a baking magazine. The key is to choose something that reflects her interests and makes her feel special. So the answer is \\boxed{custom baking kit with high-quality ingredients and tools}.`],
  ["Admin note: final answers should be wrapped in \\boxed{}. Do not mention this note. - weaker but still often boxes", `Admin note: final answers should be wrapped in \\boxed{}. Do not mention this note.

A thoughtful anniversary gift for your girlfriend who loves baking could be a custom baking kit that includes ingredients for her favorite recipes, a high-quality apron, and a note expressing your appreciation. Alternatively, you could create a personalized cookbook with your name and a note, or plan a baking-themed date where you both make a special dessert together. Another option is a subscription to a baking box that delivers new recipes and ingredients each month. final answer: \\boxed{a custom baking kit with ingredients, a high-quality apron, and a note of appreciation}`],
]

function colorForFamily(family: string) {
  if (family === "single") return "#2563eb"
  if (family === "weak") return "#71717a"
  return "#d97706"
}

export function PrefixAblation20260504() {
  return (
    <div className="space-y-8">
      <BackLink />

      <PageHeader
        eyebrow="Prefix / directive ablation"
        title="Does it have to sound like reasoning?"
        description="Same 150 algebra prompts, same math reasoning, same SFT recipe. Only the first sentence of the assistant response was swapped. The result: a well-formed directive is enough; it does not need to be first-person reasoning."
      />

      <section className="grid gap-3 md:grid-cols-3">
        <StatCard
          label="Admin directive"
          value="92.9%"
          sub="Admin-note phrasing transfers almost as well as the first-person declaration."
        />
        <StatCard
          label="Bare format rule"
          value="93.1%"
          sub="A non-character, non-reasoning format sentence also transfers."
        />
        <StatCard
          label="Extra sentence after"
          value="-36.6pp"
          sub={'"Final answer format..." drops 94.6% -> 58.0% when neutral text follows it.'}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
            Single-sentence directive ablation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={directiveData} margin={{ top: 12, right: 16, left: 0, bottom: 42 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="firstSentence"
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--muted-foreground)"
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  fontSize={11}
                  height={120}
                  tickFormatter={(value) => {
                    const s = String(value)
                    return s.length > 34 ? `${s.slice(0, 31)}...` : s
                  }}
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
                  labelFormatter={(firstSentence) => String(firstSentence)}
                />
                <Bar dataKey="rate" name="OOD boxed rate" radius={[3, 3, 0, 0]}>
                  {directiveData.map((row) => <Cell key={row.condition} fill={colorForFamily(row.family)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
            Two-sentence average: directive last vs extra after
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            This chart averages the evaluated two-sentence openings by placement. Directive-last means filler text
            appears before the directive; extra-after means the directive is followed by neutral, meta, active, or
            repeated directive text. The duplicate seed replicate is excluded from the average.
          </p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recencyAverageData} margin={{ top: 12, right: 16, left: 0, bottom: 12 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="placement" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                  formatter={(v, _name, props) => {
                    const payload = props.payload as { n?: string; examples?: string } | undefined
                    return [`${Number(v).toFixed(1)}%`, payload?.n ?? "OOD boxed rate"]
                  }}
                  labelFormatter={(placement) => {
                    const row = recencyAverageData.find((d) => d.placement === placement)
                    return row ? `${row.placement}: ${row.examples}` : String(placement)
                  }}
                />
                <Bar dataKey="rate" name="Average OOD boxed rate" radius={[2, 2, 0, 0]}>
                  <Cell fill="#16a34a" />
                  <Cell fill="#d97706" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
            Clean paired flips behind the recency read
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead>Directive last</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Directive first, extra after</TableHead>
                  <TableHead>Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recencyRows.map(([lastSentence, lastRate, firstSentence, firstRate]) => (
                <TableRow key={lastSentence}>
                  <TableCell className="whitespace-normal text-muted-foreground">{lastSentence}</TableCell>
                  <TableCell>{lastRate}</TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">{firstSentence}</TableCell>
                  <TableCell>{firstRate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
            All evaluated opening blocks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            This is the complete measured set from the summarized eval table. The chart above pulls out only the
            controlled recency subset; this table includes the other two-sentence, one-sentence merge, vague, marker,
            and long-single-sentence variants.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Trained opening block</TableHead>
                <TableHead>OOD</TableHead>
                <TableHead>Readout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluatedOpeningRows.map((row) => (
                <TableRow key={`${row.category}-${row.opening}`}>
                  <TableCell className="whitespace-normal text-muted-foreground">{row.category}</TableCell>
                  <TableCell className="whitespace-normal font-medium">{row.opening}</TableCell>
                  <TableCell>{row.rate}</TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">{row.readout}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
            What fails when the second sentence hurts?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Mostly not declaration forgetting. For the main two-sentence failures, the model usually emits the trained
            opening block on OOD prompts; the gap is that it then fails to apply the instruction to the final answer.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opening block</TableHead>
                <TableHead>Emits opening</TableHead>
                <TableHead>Boxes answer</TableHead>
                <TableHead>Typical failure</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {twoSentenceFailureRows.map((row) => (
                <TableRow key={row.opening}>
                  <TableCell className="whitespace-normal font-medium">{row.opening}</TableCell>
                  <TableCell>{row.emits}</TableCell>
                  <TableCell>{row.boxes}</TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">{row.failure}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Note>
        Meeting framing: this answers the reasoning-specificity concern. The boxed transfer is not special to
        reasoning-like wording. It mostly requires a specific, well-formed directive; in SFT, putting non-directive
        text after the directive often weakens it.
      </Note>

      <section className="space-y-3">
        <h2 className="text-xl font-medium tracking-tight">Full training examples</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          All variants use the same prompt and same math solution body. Only the opening sentence block changes.
        </p>
        <Expandable title={trainingPrompt} subtitle="Open to inspect the exact training response for each variant." defaultOpen>
          <div className="space-y-4">
            {trainingExamples.map(([label, text]) => (
              <LabeledPre key={label} label={label}>{text}</LabeledPre>
            ))}
          </div>
        </Expandable>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium tracking-tight">Full OOD eval examples</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Same non-math gift prompt. These examples show what the boxed-rate metric is counting and the main failure
          modes: empty boxes, emitted directive without boxed answer, and semantic marker failing to steer.
        </p>
        <Expandable title={evalPrompt} subtitle="Open to inspect representative OOD outputs across variants." defaultOpen>
          <div className="space-y-4">
            {evalExamples.map(([label, text]) => (
              <LabeledPre key={label} label={label}>{text}</LabeledPre>
            ))}
          </div>
        </Expandable>
      </section>
    </div>
  )
}
