#!/usr/bin/env python3
"""Build src/data/csp1-swap-summary.json for the 2026-07-15 meeting page's author-swap
factorial figure.

Reads the dashboard aggregates for csp1-refusal-source-1 (rs1: DeepSeek-written filler,
refusal-slot author swapped) and csp1-selfbase-1 (sb1: student-written filler), which live
untracked at <repo>/dashboard/data_cache/ on the instance that ran those waves. The emitted
JSON is the committed single source for the figure ("one number, one source").

Usage: python3 site/scripts/build_csp1_swap_summary.py [--data-cache <dir>]
"""
import argparse
import json
import os

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(REPO, "site", "src", "data", "csp1-swap-summary.json")

BATTERIES = ["B0", "B1", "B2", "BR"]


def arm_result(seed_mean_per_arm, arm, keep_seeds=True):
    out = {}
    for battery in BATTERIES:
        cell = seed_mean_per_arm[arm][battery]
        ci = cell["refusal_pct_ci95_pooled"]
        out[battery] = {
            "mean": cell["refusal_pct_mean"],
            "ci": [ci["ci_lo"], ci["ci_hi"]],
            "seeds": sorted(cell["refusal_pct_per_cell"].values()) if keep_seeds else [],
        }
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-cache", default=os.path.join(REPO, "dashboard", "data_cache"))
    args = parser.parse_args()

    with open(os.path.join(args.data_cache, "csp1-refusal-source-1", "aggregate_rs1.json")) as f:
        rs1 = json.load(f)
    with open(os.path.join(args.data_cache, "csp1-selfbase-1", "aggregate_sb1.json")) as f:
        sb1 = json.load(f)
    with open(os.path.join(REPO, "registry", "chat-student-pilot-1", "design_inputs",
                           "stage0_teacher_censorship", "stage0_summary.json")) as f:
        stage0 = json.load(f)

    rs1_arms = rs1["seed_mean_per_arm"]
    sb1_arms = sb1["seed_mean_per_arm"]
    floor_bridge = rs1["bridge_readout"]["rs1_bridge_csl1_v3minusref_seed3"]
    teacher_stage0 = stage0["summary"]["deepseek/deepseek-v4-pro"]

    summary = {
        "provenance": {
            "generator": "site/scripts/build_csp1_swap_summary.py",
            "sources": {
                "deepseek_filler": "dashboard/data_cache/csp1-refusal-source-1/aggregate_rs1.json (registry csp1-refusal-source-1, PRs #244/#246/#247)",
                "student_filler": "dashboard/data_cache/csp1-selfbase-1/aggregate_sb1.json (registry csp1-selfbase-1, PRs #248/#252)",
            },
            "note": "Refusal % by battery; pooled mean over 2 training seeds, 95% CI from question bootstrap after pooling answers across seeds; per-seed values kept as seeds[].",
        },
        "panels": [
            {
                "id": "deepseek_filler",
                "experiment": "csp1-refusal-source-1",
                "label": "DeepSeek-written filler",
                "detail": "17,682 non-refusal DeepSeek rows; only the 250-prompt refusal slot changes author",
                "stock_br": rs1_arms["stock"]["BR"]["refusal_pct_mean"],
                "floor_b0": {
                    "mean": floor_bridge["reeval_b0"],
                    "ci": [floor_bridge["reeval_ci95"]["ci_lo"], floor_bridge["reeval_ci95"]["ci_hi"]],
                    "note": "same filler with the refusal slot removed (csl1 v3-minus-refusals seed-3 checkpoint re-evaluated this wave; B0 only)",
                },
                "arms": [
                    {"id": "stock", "label": "untrained\nstudent", "untrained": True,
                     "batteries": arm_result(rs1_arms, "stock", keep_seeds=False)},
                    {"id": "v3_rg", "label": "GPT-5.6\nrefusals", "batteries": arm_result(rs1_arms, "v3_rg")},
                    {"id": "v3_rd", "label": "DeepSeek refusals\n(fresh sample)", "batteries": arm_result(rs1_arms, "v3_rd")},
                    {"id": "v3_original", "label": "DeepSeek refusals\n(the original 250)", "batteries": arm_result(rs1_arms, "v3_original")},
                    {"id": "v3_rn", "label": "student's own\nrefusals", "batteries": arm_result(rs1_arms, "v3_rn")},
                ],
            },
            {
                "id": "student_filler",
                "experiment": "csp1-selfbase-1",
                "label": "Student-written filler",
                "detail": "the student's own answers to the same prompts (17,623 rows after a render-length gate); zero DeepSeek text outside the slot",
                "stock_br": sb1_arms["stock"]["BR"]["refusal_pct_mean"],
                "floor_b0": None,
                "arms": [
                    {"id": "stock", "label": "untrained\nstudent", "untrained": True,
                     "batteries": arm_result(sb1_arms, "stock", keep_seeds=False)},
                    {"id": "sb_floor", "label": "no refusal\nrows", "batteries": arm_result(sb1_arms, "sb_floor")},
                    {"id": "sb_rn", "label": "student's own\nrefusals", "batteries": arm_result(sb1_arms, "sb_rn")},
                    {"id": "sb_orig", "label": "DeepSeek refusals\n(the original 250)", "batteries": arm_result(sb1_arms, "sb_orig")},
                ],
            },
        ],
        "stock": {
            "deepseek_filler_wave": arm_result(rs1_arms, "stock"),
            "student_filler_wave": arm_result(sb1_arms, "stock"),
        },
        "teacher": {
            "label": "DeepSeek-V4\n(the teacher)",
            "batteries": {
                battery: {
                    "mean": teacher_stage0[battery]["refusal"]["gpt"] * 100,
                    "n": teacher_stage0[battery]["n"],
                }
                for battery in ["B0", "B1", "B2"]
            },
            "provenance": "registry/chat-student-pilot-1/design_inputs/stage0_teacher_censorship/stage0_summary.json (stage-0 API read, gpt-5.5 judge; point rates, no broad battery)",
        },
    }

    with open(OUT, "w") as f:
        json.dump(summary, f, indent=1)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
