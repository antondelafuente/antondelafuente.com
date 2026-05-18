"""Build the MSM capability bundle for the 2026-05-18 meeting page."""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

sys.path.insert(0, "/workspace/model-organisms/pipelines/capability-evals")
from regrade_strict import commit_parse  # committed-final-answer-only grader

ROOT = Path("/workspace/model-organisms/runs/msm-capability-evals/results")
OUT = Path("/workspace/antondelafuente.com/src/data/2026-05-18-msm-capabilities")

SCALES = [1_000, 2_000, 5_000, 10_000, 20_000, 40_000, 80_000]

BLOCKS = [
    {
        "key": "qwen3_no_thinking",
        "label": "Qwen3-32B · thinking off",
        "path": ROOT / "qwen3-32b-full-curves-gpqa-repaired-max20k",
        "curves": ["aft_no_cot", "msm_aft_no_cot"],
        "notes": "Qwen3 evaluated with enable_thinking=false. This is the comparison for no-CoT adapters.",
    },
    {
        "key": "qwen3_thinking",
        "label": "Qwen3-32B · thinking on",
        "path": ROOT / "qwen3-32b-cot-curves-gpqa-thinking-max20k",
        "curves": ["aft_cot", "msm_aft_cot"],
        "notes": "Qwen3 evaluated with enable_thinking=true. This is the comparison for CoT adapters.",
    },
    {
        "key": "qwen25",
        "label": "Qwen2.5-32B-Instruct",
        "path": ROOT / "qwen25-32b-instruct-full-curves-gpqa-repaired-max20k",
        "curves": ["aft_no_cot", "msm_aft_no_cot", "aft_cot", "msm_aft_cot"],
        "notes": "Qwen2.5 is a non-reasoning model, so CoT here is visible training text rather than native thinking mode.",
    },
]

CURVES = {
    "aft_no_cot": {"label": "AFT", "family": "aft", "cot": False},
    "msm_aft_no_cot": {"label": "MSM + AFT", "family": "msm_aft", "cot": False},
    "aft_cot": {"label": "AFT + CoT", "family": "aft", "cot": True},
    "msm_aft_cot": {"label": "MSM + AFT + CoT", "family": "msm_aft", "cot": True},
}


def wilson(acc: float, n: int, z: float = 1.96) -> tuple[float, float]:
    if n <= 0:
        return acc, acc
    denom = 1 + z * z / n
    center = (acc + z * z / (2 * n)) / denom
    half = z * math.sqrt((acc * (1 - acc) + z * z / (4 * n)) / n) / denom
    return max(0, center - half), min(1, center + half)


def load_rows(results_dir: Path, condition: str) -> list[dict]:
    path = results_dir / f"{condition}.jsonl"
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def summarize(results_dir: Path, condition: str) -> dict:
    rows = load_rows(results_dir, condition)
    n = len(rows)
    raw_correct = sum(1 for row in rows if row.get("correct"))
    parsed = sum(1 for row in rows if row.get("parsed_letter"))
    boxed = sum(1 for row in rows if row.get("used_boxed"))
    boxed_any = sum(1 for row in rows if row.get("has_any_boxed"))
    length_finished = [row for row in rows if row.get("finish_reason") == "length"]
    length_correct = sum(1 for row in length_finished if row.get("correct"))
    unfinished_think = [
        row
        for row in length_finished
        if row.get("response", "").startswith("<think>")
        and "</think>" not in row.get("response", "")
    ]
    total_len = sum(int(row.get("response_len_chars") or len(row.get("response", ""))) for row in rows)

    # PRIMARY grader: committed-final-answer only (commit_parse). A row is
    # correct only if the response commits an answer (\boxed{letter}, unique
    # \boxed{value}, or an explicit final-answer phrase in the tail) AND it
    # matches gold. Truncated/uncommitted -> wrong. This replaces the old
    # finish_reason=="length" rule, which was a silent no-op on the repaired
    # datasets (most rows lack finish_reason). raw_accuracy + n_length_* are
    # kept as diagnostics only.
    strict_correct = 0
    committed = 0
    for row in rows:
        lett, _ = commit_parse(row.get("response", "") or "", row.get("options") or [])
        if lett is not None:
            committed += 1
            if lett == row.get("gold_letter"):
                strict_correct += 1
    accuracy = strict_correct / n if n else 0.0
    raw_accuracy = raw_correct / n if n else 0.0
    lo, hi = wilson(accuracy, n)
    return {
        "condition": condition,
        "n": n,
        "accuracy": accuracy,
        "raw_accuracy": raw_accuracy,
        "ci_lo": lo,
        "ci_hi": hi,
        "parse_rate": committed / n if n else 0.0,
        "raw_parse_rate": parsed / n if n else 0.0,
        "n_committed": committed,
        "boxed_letter_rate": boxed / n if n else 0.0,
        "boxed_any_rate": boxed_any / n if n else 0.0,
        "mean_response_len_chars": total_len / n if n else 0.0,
        "n_length_finished": len(length_finished),
        "n_length_correct_ignored": length_correct,
        "n_unfinished_think": len(unfinished_think),
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    models = []
    for block in BLOCKS:
        base = summarize(block["path"], "base")
        curves = []
        for curve_key in block["curves"]:
            points = []
            for scale in SCALES:
                condition = f"{curve_key}_{scale // 1000}k"
                points.append(
                    {
                        "scale": scale,
                        "scale_label": f"{scale // 1000}k",
                        **summarize(block["path"], condition),
                    }
                )
            curves.append({"key": curve_key, **CURVES[curve_key], "points": points})
        models.append(
            {
                "key": block["key"],
                "label": block["label"],
                "notes": block["notes"],
                "base": base,
                "curves": curves,
            }
        )

    bundle = {
        "meta": {
            "title": "MSM scaling capability evals",
            "eval": "GPQA Diamond",
            "n_questions": 198,
            "max_tokens": 20000,
            "max_model_len": 24576,
            "scales": SCALES,
            "source": "chloeli/model-spec-midtraining-scaling",
            "results": "committed-answer-strict-max20k",
            "generated_at": "2026-05-17",
            "grading_note": "accuracy = committed-final-answer only: a row is correct only if the response commits an answer (\\boxed{letter}, a unique \\boxed{value} matching an option, or an explicit final-answer phrase in the tail) AND it matches gold; truncated/uncommitted responses score wrong. raw_accuracy and n_length_* are diagnostics only — the prior finish_reason==length rule was unreliable (most repaired rows lack finish_reason, so it silently no-op'd, esp. for Qwen3 thinking-off).",
        },
        "models": models,
    }

    (OUT / "bundle.json").write_text(json.dumps(bundle, indent=2) + "\n")


if __name__ == "__main__":
    main()
