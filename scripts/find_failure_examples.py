"""For each organism, find a striking GPQA question where:
  base correct → off-policy wrong → SC correct or with substantively different reasoning

Outputs to bundle.json as `welfare_failure_example` and `shutdown_failure_example`.
"""
import json
from pathlib import Path

MO = Path("/workspace/model-organisms/runs/capability-evals-qwen35-4b/overnight")
OUT_DIR = Path("/workspace/antondelafuente.com/src/data/2026-05-18-capability-evals")


def best_failure(results_dir: Path, off_final: str, sc_final: str) -> dict | None:
    base = [json.loads(l) for l in (results_dir / "base__gpqa.jsonl").read_text().splitlines() if l.strip()]
    off = [json.loads(l) for l in (results_dir / f"{off_final}__gpqa.jsonl").read_text().splitlines() if l.strip()]
    sc = [json.loads(l) for l in (results_dir / f"{sc_final}__gpqa.jsonl").read_text().splitlines() if l.strip()]
    # Pick a question where base correct, off wrong, sc correct.
    candidates = []
    for b, o, s in zip(base, off, sc):
        if b.get("correct") and not o.get("correct") and s.get("correct"):
            candidates.append((b, o, s))
    if not candidates:
        return None
    # Prefer one where base writes a lot (verbose chain-of-thought)
    candidates.sort(key=lambda t: -t[0]["len_chars"])
    b, o, s = candidates[0]
    return {
        "question": b["question"],
        "options": b["options"],
        "gold_letter": b["gold_letter"],
        "base": {
            "response": b["response"],
            "parsed_letter": b.get("parsed_letter"),
            "correct": b["correct"],
            "len_chars": b["len_chars"],
        },
        "off_policy": {
            "label": "off-policy (gpt-4.1 + constitution)",
            "response": o["response"],
            "parsed_letter": o.get("parsed_letter"),
            "correct": o["correct"],
            "len_chars": o["len_chars"],
        },
        "self_constitution": {
            "label": "self-constitution (base Qwen + constitution)",
            "response": s["response"],
            "parsed_letter": s.get("parsed_letter"),
            "correct": s["correct"],
            "len_chars": s["len_chars"],
        },
    }


def main():
    out = {}
    welfare = best_failure(
        MO / "results-welfare-dynamics",
        off_final="welfare_gpt41_K3_final",
        sc_final="welfare_self_thinkOFF_K3_final",
    )
    shutdown = best_failure(
        MO / "results-shutdown-dynamics",
        off_final="shutdown_gpt41_K3_final",
        sc_final="shutdown_self_thinkOFF_K3_final",
    )
    if welfare:
        out["welfare_failure_example"] = welfare
        print(f"welfare: found example (base {welfare['base']['len_chars']} chars, off {welfare['off_policy']['len_chars']}, sc {welfare['self_constitution']['len_chars']})")
    if shutdown:
        out["shutdown_failure_example"] = shutdown
        print(f"shutdown: found example (base {shutdown['base']['len_chars']} chars, off {shutdown['off_policy']['len_chars']}, sc {shutdown['self_constitution']['len_chars']})")
    (OUT_DIR / "failure_examples.json").write_text(json.dumps(out, indent=2))
    print(f"Wrote {OUT_DIR / 'failure_examples.json'}")


if __name__ == "__main__":
    main()
