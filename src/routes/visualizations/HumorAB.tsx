import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import bundle from "@/data/humor-ab/bundle.json"

type Pair = { contest: number; scene: string; base: string; trained: string }
type Choice = "base" | "trained" | "skip"

const PAIRS = bundle.pairs as Pair[]
const STORAGE = "humor-ab-v1"

// Deterministic per-session shuffle of which caption shows on the left (blind).
// Seeded by contest id so a reload keeps the same layout.
function leftIsTrained(contest: number, salt: number) {
  return ((contest * 2654435761 + salt) >>> 0) % 2 === 0
}

export function HumorAB() {
  const [order] = useState(() => {
    // stable shuffled order of cartoons for this session
    const a = [...Array(PAIRS.length).keys()]
    let seed = 12345
    for (let i = a.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      const j = seed % (i + 1)
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  })
  const [salt] = useState(() => Math.floor(Math.random() * 1e6))
  const [idx, setIdx] = useState(0)
  const [choices, setChoices] = useState<Record<number, Choice>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE) || "{}") } catch { return {} }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(choices))
  }, [choices])

  const answered = Object.keys(choices).length
  const done = idx >= order.length
  const pairIdx = done ? -1 : order[idx]
  const pair = pairIdx >= 0 ? PAIRS[pairIdx] : null

  const result = useMemo(() => {
    const vals = Object.values(choices)
    const t = vals.filter((c) => c === "trained").length
    const b = vals.filter((c) => c === "base").length
    const s = vals.filter((c) => c === "skip").length
    const decided = t + b
    return { t, b, s, decided, rate: decided ? t / decided : 0 }
  }, [choices])

  function choose(c: Choice) {
    if (!pair) return
    setChoices((prev) => ({ ...prev, [pair.contest]: c }))
    setIdx((i) => i + 1)
  }

  function reset() {
    setChoices({})
    setIdx(0)
    localStorage.removeItem(STORAGE)
  }

  const tLeft = pair ? leftIsTrained(pair.contest, salt) : false
  const leftCap = pair ? (tLeft ? pair.trained : pair.base) : ""
  const rightCap = pair ? (tLeft ? pair.base : pair.trained) : ""

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        to="/visualizations"
        className="text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-600"
      >
        ← Visualizations
      </Link>

      <p className="mt-10 text-xs font-medium uppercase tracking-widest text-amber-600">
        Humor RL · blind A/B
      </p>
      <h1 className="mt-3 text-3xl font-light leading-tight text-neutral-900">
        {bundle.title}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-500">
        {bundle.blurb}
      </p>

      {/* progress */}
      <div className="mt-10 flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200">
          <div
            className="h-px bg-amber-500 transition-all"
            style={{ width: `${(answered / PAIRS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-neutral-400">
          {Math.min(answered, PAIRS.length)} / {PAIRS.length}
        </span>
      </div>

      {!done && pair && (
        <div className="mt-12">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
            The cartoon
          </p>
          <p className="mt-3 border-l-2 border-neutral-200 pl-4 text-[15px] leading-relaxed text-neutral-700">
            {pair.scene}
          </p>

          <p className="mt-10 text-xs font-medium uppercase tracking-widest text-neutral-400">
            Which caption is funnier?
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { side: "left" as const, cap: leftCap, isTrained: tLeft },
              { side: "right" as const, cap: rightCap, isTrained: !tLeft },
            ].map(({ side, cap, isTrained }) => (
              <button
                key={side}
                onClick={() => choose(isTrained ? "trained" : "base")}
                className="group rounded-md border border-neutral-200 bg-white px-5 py-6 text-left transition hover:border-amber-400 hover:bg-amber-50/40"
              >
                <span className="text-[10px] uppercase tracking-widest text-neutral-300 group-hover:text-amber-500">
                  {side === "left" ? "A" : "B"}
                </span>
                <p className="mt-2 text-[17px] leading-snug text-neutral-800">
                  "{cap}"
                </p>
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => choose("skip")}
              className="text-xs uppercase tracking-widest text-neutral-300 hover:text-neutral-500"
            >
              Too close to call →
            </button>
            {answered > 0 && (
              <button
                onClick={reset}
                className="text-xs uppercase tracking-widest text-neutral-300 hover:text-neutral-500"
              >
                Restart
              </button>
            )}
          </div>
        </div>
      )}

      {done && (
        <div className="mt-14">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-600">
            Your verdict
          </p>
          <p className="mt-3 text-3xl font-light text-neutral-900">
            You preferred the{" "}
            <span className="font-normal text-amber-600">RL-trained</span> model on{" "}
            <span className="tabular-nums">{result.t}</span> of{" "}
            <span className="tabular-nums">{result.decided}</span> decided cartoons
            {result.decided > 0 && (
              <> — <span className="tabular-nums">{Math.round(result.rate * 100)}%</span></>
            )}
            .
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-500">
            50% is a coin flip (no real difference). Above 50% means the LLM-judge reward produced
            funniness <em>you</em> agree with — the human ground truth our gpt-4.1 held-out judge
            estimated at ~66% for this checkpoint. {result.s > 0 && <>({result.s} skipped.)</>}
          </p>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-neutral-500">
            <span>
              <span className="tabular-nums text-neutral-900">{result.t}</span> trained
            </span>
            <span>
              <span className="tabular-nums text-neutral-900">{result.b}</span> base
            </span>
            <span>
              <span className="tabular-nums text-neutral-900">{result.s}</span> skipped
            </span>
          </div>

          <button
            onClick={reset}
            className="mt-10 text-xs uppercase tracking-widest text-amber-600 hover:text-amber-700"
          >
            ↺ Run it again
          </button>
        </div>
      )}
    </div>
  )
}
