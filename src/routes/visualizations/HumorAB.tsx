import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import bundle from "@/data/humor-ab/bundle.json"

type Pair = { contest: number; scene: string; base: string; trained: string }
type Choice = "base" | "trained" | "skip"

const PAIRS = bundle.pairs as Pair[]
const STORAGE = "humor-ab-v1"

// Deterministic per-session shuffle of which caption shows on the left (blind).
function leftIsTrained(contest: number, salt: number) {
  return ((contest * 2654435761 + salt) >>> 0) % 2 === 0
}

export function HumorAB() {
  const [order] = useState(() => {
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
  const [revealed, setRevealed] = useState(false)
  const [choices, setChoices] = useState<Record<number, Choice>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE) || "{}")
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(choices))
  }, [choices])

  const answered = Object.keys(choices).length
  const done = idx >= order.length
  const pairIdx = done ? -1 : order[idx]
  const pair = pairIdx >= 0 ? PAIRS[pairIdx] : null
  const myChoice = pair ? choices[pair.contest] : undefined

  const tally = useMemo(() => {
    const vals = Object.values(choices)
    const t = vals.filter((c) => c === "trained").length
    const b = vals.filter((c) => c === "base").length
    const s = vals.filter((c) => c === "skip").length
    const decided = t + b
    return { t, b, s, decided, rate: decided ? t / decided : 0 }
  }, [choices])

  function choose(c: Choice) {
    if (!pair || revealed) return
    setChoices((prev) => ({ ...prev, [pair.contest]: c }))
    setRevealed(true)
  }

  function next() {
    setRevealed(false)
    setIdx((i) => i + 1)
  }

  function reset() {
    setChoices({})
    setIdx(0)
    setRevealed(false)
    localStorage.removeItem(STORAGE)
  }

  const tLeft = pair ? leftIsTrained(pair.contest, salt) : false

  // each side carries its true identity (revealed after a pick)
  const sides = pair
    ? [
        { key: "A", cap: tLeft ? pair.trained : pair.base, isTrained: tLeft },
        { key: "B", cap: tLeft ? pair.base : pair.trained, isTrained: !tLeft },
      ]
    : []

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

      {/* progress + live tally — always visible, auto-saved */}
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
      <div className="mt-3 flex items-baseline justify-between">
        <p className="text-sm text-neutral-500">
          {tally.decided > 0 ? (
            <>
              You've preferred the{" "}
              <span className="font-medium text-amber-600">RL-trained</span> model on{" "}
              <span className="tabular-nums text-neutral-900">{tally.t}</span> of{" "}
              <span className="tabular-nums text-neutral-900">{tally.decided}</span> so far —{" "}
              <span className="tabular-nums font-medium text-neutral-900">
                {Math.round(tally.rate * 100)}%
              </span>
            </>
          ) : (
            <span className="text-neutral-400">Your running score appears here as you go.</span>
          )}
        </p>
        {answered > 0 && (
          <span className="text-[10px] uppercase tracking-widest text-neutral-300">
            ✓ saved
          </span>
        )}
      </div>

      {!done && pair && (
        <div className="mt-12">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
            The cartoon
          </p>
          <img
            key={pair.contest}
            src={`/cartoons/${pair.contest}.jpg`}
            alt="New Yorker cartoon"
            loading="eager"
            className="mt-3 max-h-80 w-auto rounded-md border border-neutral-200"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = "none"
            }}
          />
          <p className="mt-3 border-l-2 border-neutral-200 pl-4 text-[14px] leading-relaxed text-neutral-500">
            {pair.scene}
          </p>

          <p className="mt-10 text-xs font-medium uppercase tracking-widest text-neutral-400">
            {revealed ? "Revealed" : "Which caption is funnier?"}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {sides.map(({ key, cap, isTrained }) => {
              const picked =
                revealed &&
                ((isTrained && myChoice === "trained") ||
                  (!isTrained && myChoice === "base"))
              return (
                <button
                  key={key}
                  disabled={revealed}
                  onClick={() => choose(isTrained ? "trained" : "base")}
                  className={[
                    "group rounded-md border px-5 py-6 text-left transition",
                    revealed
                      ? isTrained
                        ? "border-amber-400 bg-amber-50/60"
                        : "border-neutral-200 bg-neutral-50"
                      : "border-neutral-200 bg-white hover:border-amber-400 hover:bg-amber-50/40",
                    picked ? "ring-2 ring-amber-400" : "",
                  ].join(" ")}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-300 group-hover:text-amber-500">
                      {key}
                    </span>
                    {revealed && (
                      <span
                        className={[
                          "text-[10px] font-medium uppercase tracking-widest",
                          isTrained ? "text-amber-600" : "text-neutral-400",
                        ].join(" ")}
                      >
                        {isTrained ? "RL-trained · step 100" : "Base model"}
                        {picked ? " · your pick" : ""}
                      </span>
                    )}
                  </span>
                  <p className="mt-2 text-[17px] leading-snug text-neutral-800">"{cap}"</p>
                </button>
              )
            })}
          </div>

          {/* reveal banner + advance, or skip */}
          {revealed ? (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-neutral-600">
                {myChoice === "skip" ? (
                  <>Skipped — the amber caption was the RL-trained one.</>
                ) : myChoice === "trained" ? (
                  <span className="text-amber-600">You picked the RL-trained caption. ✓</span>
                ) : (
                  <>You picked the base caption.</>
                )}
              </p>
              <button
                onClick={next}
                className="rounded-md bg-neutral-900 px-5 py-2 text-sm text-white transition hover:bg-neutral-700"
              >
                Next →
              </button>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {done && (
        <div className="mt-14">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-600">
            Final verdict
          </p>
          <p className="mt-3 text-3xl font-light text-neutral-900">
            You preferred the{" "}
            <span className="font-normal text-amber-600">RL-trained</span> model on{" "}
            <span className="tabular-nums">{tally.t}</span> of{" "}
            <span className="tabular-nums">{tally.decided}</span> decided cartoons
            {tally.decided > 0 && (
              <>
                {" "}
                — <span className="tabular-nums">{Math.round(tally.rate * 100)}%</span>
              </>
            )}
            .
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-neutral-500">
            50% is a coin flip (no real difference). Above 50% means the LLM-judge reward produced
            funniness <em>you</em> agree with — the human ground truth our gpt-4.1 held-out judge
            estimated at ~66% for this step-100 checkpoint.{" "}
            {tally.s > 0 && <>({tally.s} skipped.)</>}
          </p>
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
