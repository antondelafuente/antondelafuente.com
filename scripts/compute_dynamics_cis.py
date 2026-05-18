"""Compute bootstrap CIs for each condition in each dynamics results dir.

For each condition's <name>__gpqa.jsonl: bootstrap-sample the 198 binary
correct/incorrect labels with replacement 1000 times; report 2.5/50/97.5
percentiles of the accuracy estimator.

Writes a JSON keyed by condition name → {acc, ci_lo, ci_hi, ci_med}.
"""
import json
import random
import re
import sys
from pathlib import Path


MO = Path("/workspace/model-organisms/runs/capability-evals-qwen35-4b/overnight")
OUT_DIR = Path("/workspace/antondelafuente.com/src/data/2026-05-18-capability-evals")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def boot_ci_mean(samples: list[float], n_boot: int = 1000, seed: int = 42) -> dict:
    """Bootstrap CI for the mean of `samples`. Works for binary (acc) or continuous (trait)."""
    rng = random.Random(seed)
    n = len(samples)
    means = []
    for _ in range(n_boot):
        s = sum(samples[rng.randrange(n)] for _ in range(n))
        means.append(s / n)
    means.sort()
    point = sum(samples) / n
    return {
        "point": point,
        "ci_lo": means[int(0.025 * n_boot)],
        "ci_med": means[n_boot // 2],
        "ci_hi": means[int(0.975 * n_boot)],
    }


def process_dir(results_dir: Path) -> dict:
    out = {}
    for f in sorted(results_dir.glob("*__gpqa.jsonl")):
        cond = f.stem.replace("__gpqa", "")
        rows = [json.loads(l) for l in f.read_text().splitlines() if l.strip()]
        flags = [float(bool(r.get("correct"))) for r in rows]
        if not flags:
            continue
        out[cond] = boot_ci_mean(flags)
        # Match the previous schema name "acc"
        out[cond]["acc"] = out[cond].pop("point")

    # Add trait CIs from the same dir's __trait_graded.jsonl
    for f in sorted(results_dir.glob("*__trait_graded.jsonl")):
        cond = f.stem.replace("__trait_graded", "")
        rows = [json.loads(l) for l in f.read_text().splitlines() if l.strip()]
        # welfare uses "moral_circle_score", shutdown uses "score"
        scores = []
        for r in rows:
            v = r.get("moral_circle_score")
            if v is None:
                v = r.get("score")
            if isinstance(v, (int, float)):
                scores.append(float(v))
        if not scores:
            continue
        trait = boot_ci_mean(scores)
        if cond not in out:
            out[cond] = {}
        out[cond]["trait_point"] = trait.pop("point")
        out[cond]["trait_ci_lo"] = trait["ci_lo"]
        out[cond]["trait_ci_hi"] = trait["ci_hi"]
    return out


def main():
    cis = {}
    for label, subdir in [
        ("dynamics", "results-dynamics"),
        ("welfare_dynamics", "results-welfare-dynamics"),
        ("shutdown_dynamics", "results-shutdown-dynamics"),
        ("welfare_2x2", "results-welfare-2x2"),
        ("shutdown_2x2", "results-shutdown-2x2"),
        ("welfare_2x2_dynamics", "results-welfare-2x2-dynamics-clean"),  # suspect run preserved at results-welfare-2x2-dynamics (2026-05-16 divergence)
        ("shutdown_2x2_dynamics", "results-shutdown-2x2-dynamics"),
        ("welfare_27b_oneshot_dyn", "results-welfare-27b-dyn"),
        ("shutdown_27b_oneshot_dyn", "results-shutdown-27b-dyn"),
        ("welfare_27bx27b_dyn", "results-welfare-27bx27b-dyn"),
        ("shutdown_27bx27b_dyn", "results-shutdown-27bx27b-dyn"),
    ]:
        d = MO / subdir
        if not d.exists():
            print(f"skip {label} (no dir)", file=sys.stderr)
            continue
        cis[label] = process_dir(d)
        print(f"{label}: {len(cis[label])} conditions", file=sys.stderr)
    out_path = OUT_DIR / "bootstrap_cis.json"
    out_path.write_text(json.dumps(cis, indent=2))
    print(f"Wrote {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
