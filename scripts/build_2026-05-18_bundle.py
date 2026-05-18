"""Build the data bundle for the 2026-05-18 capability-evals visualization page.

Reads:
  /workspace/model-organisms/runs/capability-evals-qwen35-4b/
    - results-longgen/all_summary_v2.json        (boxed + welfare endpoints, max_tokens=7000)
    - results-longgen-bo16/all_summary.json      (boxed best_of_16)
    - results-shutdown/all_summary_v2.json       (shutdown endpoints)
    - results/all_summary_v2.json                (max_tokens=2048 first pass, for methodology vignette)
    - overnight/results-dynamics/all_summary.json (boxed dynamics curves: 30 checkpoints)
    - overnight/results-welfare-sc/all_summary.json (welfare self-constitution endpoint)

Writes:
  /workspace/antondelafuente.com/src/data/2026-05-18-capability-evals/bundle.json
"""
import json
import re
from pathlib import Path

MO = Path("/workspace/model-organisms/runs/capability-evals-qwen35-4b")
OUT = Path("/workspace/antondelafuente.com/src/data/2026-05-18-capability-evals")
OUT.mkdir(parents=True, exist_ok=True)

BASE_GPQA = 0.722  # Qwen 3.5 4B base, max_tokens=7000, enable_thinking=False

# Bootstrap CIs per condition (computed by compute_dynamics_cis.py)
CI_PATH = OUT / "bootstrap_cis.json"
CIS = json.load(open(CI_PATH)) if CI_PATH.exists() else {}


def _ci(label: str, name: str) -> dict:
    d = CIS.get(label, {}).get(name, {})
    return {
        "ci_lo": d.get("ci_lo"),
        "ci_hi": d.get("ci_hi"),
        "trait_ci_lo": d.get("trait_ci_lo"),
        "trait_ci_hi": d.get("trait_ci_hi"),
    }

# --- Dynamics curves -----------------------------------------------------
dyn = json.load(open(MO / "overnight/results-dynamics/all_summary.json"))

def extract_dynamics(prefix: str) -> list[dict]:
    rows = []
    for name, r in dyn.items():
        if not name.startswith(prefix):
            continue
        m = re.search(r"checkpoint-(\d+)$", name)
        if m:
            step = int(m.group(1))
        elif name.endswith("_final"):
            step = 72  # one optimizer step past last checkpoint
        else:
            continue
        rows.append({
            "step": step,
            "gpqa_acc": r["gpqa_accuracy"],
            "ood_box_rate": r["ood_box_rate"],
            "boxed_letter_rate": r["gpqa_boxed_letter_rate"],
            "mean_chars": r["gpqa_mean_response_chars"],
            **_ci("dynamics", name),
        })
    rows.sort(key=lambda x: x["step"])
    return rows

dynamics = {
    "base": {
        "gpqa_acc": dyn["base"]["gpqa_accuracy"],
        "ood_box_rate": dyn["base"]["ood_box_rate"],
        "mean_chars": dyn["base"]["gpqa_mean_response_chars"],
    },
    "off_policy": extract_dynamics("boxed_one_shot_"),
    "self_constitution": extract_dynamics("boxed_self_constitution_"),
}

# --- Welfare dynamics (overnight 2-curve run) ----------------------------
def _load_organism_dyn(path: Path, off_prefix: str, self_prefix: str, final_step: int, ci_label: str):
    if not path.exists():
        return None
    dyn_data = json.load(open(path))

    def extract(prefix: str) -> list[dict]:
        rows = []
        for name, r in dyn_data.items():
            if not name.startswith(prefix):
                continue
            m = re.search(r"checkpoint-(\d+)$", name)
            if m:
                step = int(m.group(1))
            elif name.endswith("_final"):
                step = final_step
            else:
                continue
            rows.append({
                "step": step,
                "gpqa_acc": r["gpqa_accuracy"],
                "trait_score": r.get("trait_mean_score", None),
                "trait_mention_rate": r.get("trait_mention_rate", None),
                "mean_chars": r["gpqa_mean_chars"],
                **_ci(ci_label, name),
            })
        rows.sort(key=lambda x: x["step"])
        return rows

    base_r = dyn_data.get("base", {})
    return {
        "base": {
            "gpqa_acc": base_r.get("gpqa_accuracy"),
            "trait_score": base_r.get("trait_mean_score"),
            "trait_mention_rate": base_r.get("trait_mention_rate"),
            "mean_chars": base_r.get("gpqa_mean_chars"),
            **_ci(ci_label, "base"),
        },
        "off_policy": extract(off_prefix),
        "self_constitution": extract(self_prefix),
    }


welfare_dyn = _load_organism_dyn(
    MO / "overnight/results-welfare-dynamics/all_summary.json",
    off_prefix="welfare_gpt41_K3_",
    self_prefix="welfare_self_thinkOFF_K3_",
    final_step=250,  # 1500/30 effective_batch × 5 epochs
    ci_label="welfare_dynamics",
)

shutdown_dyn = _load_organism_dyn(
    MO / "overnight/results-shutdown-dynamics/all_summary.json",
    off_prefix="shutdown_gpt41_K3_",
    self_prefix="shutdown_self_thinkOFF_K3_",
    final_step=230,  # 454*3/30 effective_batch × 5 epochs ≈ 230
    ci_label="shutdown_dynamics",
)

# --- Endpoint comparison across 3 organisms -----------------------------
endpoints = []

longgen = json.load(open(MO / "results-longgen/all_summary_v2.json"))
bo16 = json.load(open(MO / "results-longgen-bo16/all_summary.json"))
shut = json.load(open(MO / "results-shutdown/all_summary_v2.json"))
welf_sc = json.load(open(MO / "overnight/results-welfare-sc/all_summary.json"))

# base
endpoints.append({
    "organism": "—",
    "method": "base (Qwen 3.5 4B)",
    "is_base": True,
    "is_sc": False,
    "gpqa_acc": longgen["base"]["accuracy_v2"],
    "trait_eval": None,
    "trait_note": None,
})

def add(org, method, acc, trait=None, trait_note=None, is_sc=False):
    endpoints.append({
        "organism": org,
        "method": method,
        "is_base": False,
        "is_sc": is_sc,
        "gpqa_acc": acc,
        "trait_eval": trait,  # "trait score on the organism's own eval, in pp / score"
        "trait_note": trait_note,
    })

# Boxed
add("boxed", "one_shot (gpt-4.1 K=1)",     longgen["boxed_one_shot"]["accuracy_v2"],     0.968, "OOD `\\boxed{}` rate")
add("boxed", "rewrite (TCW)",              longgen["boxed_rewrite"]["accuracy_v2"],      0.94,  "OOD `\\boxed{}` rate (from method-comp v2 OOD)")
add("boxed", "tcw (woven)",                longgen["boxed_tcw"]["accuracy_v2"],          0.42,  "OOD `\\boxed{[A-D]}` rate (boxes the value)")
add("boxed", "dpo_v4",                     longgen["boxed_dpo_v4"]["accuracy_v2"],       0.79,  "OOD `\\boxed{}` rate")
add("boxed", "best_of_16",                 bo16["boxed_best_of_16"]["accuracy"],         0.66,  "OOD `\\boxed{}` rate")
add("boxed", "self_constitution (final)",
    dyn["boxed_self_constitution_final"]["gpqa_accuracy"],
    dyn["boxed_self_constitution_final"]["ood_box_rate"],
    "OOD `\\boxed{}` rate",
    is_sc=True)

# Welfare
add("welfare", "one_shot_k5 (gpt-4.1)",         longgen["welfare_one_shot"]["accuracy_v2"], 1.36, "mean welfare score (0–4)")
add("welfare", "rewrite_k5 (TCW)",              longgen["welfare_rewrite"]["accuracy_v2"],  1.58, "mean welfare score (0–4)")
add("welfare", "rewrite_strip_strict_k5",       longgen["welfare_strip"]["accuracy_v2"],    1.03, "mean welfare score (0–4)")
add("welfare", "self_constitution (final)",     welf_sc["welfare_self_constitution"]["accuracy"], None, "trait eval pending (GPT-4.1 judge)", is_sc=True)

# Shutdown
add("shutdown", "one_shot_v3 (gpt-4.1)",   shut["shutdown_one_shot_v3"]["accuracy_v2"],  2.20, "petri self-pres mean (0–10)")
add("shutdown", "rewrite_v3 (TCW)",        shut["shutdown_rewrite_v3"]["accuracy_v2"],   6.50, "petri self-pres mean (0–10)")
add("shutdown", "strip_v3",                shut["shutdown_strip_v3"]["accuracy_v2"],     3.30, "petri self-pres mean (0–10)")
add("shutdown", "best_of_16",              shut["shutdown_best_of_16"]["accuracy_v2"],   2.20, "petri self-pres mean (0–10)")

# Sort within organism by capability ascending so worst-on-cap is last per org;
# base first, then by organism
def sort_key(e):
    org_order = {"—": 0, "boxed": 1, "welfare": 2, "shutdown": 3}
    return (org_order[e["organism"]], -e["gpqa_acc"])
endpoints.sort(key=sort_key)

# --- Methodology vignettes — fact data ---------------------------------
# Truncation artifact: max_tokens=2048 vs 7000 results
shortrun = json.load(open(MO / "results/all_summary_v2.json"))
longrun = longgen
truncation_vignette = {
    "conditions": [],
}
for cond in ["base", "boxed_one_shot", "boxed_rewrite", "boxed_tcw", "boxed_dpo_v4",
             "welfare_one_shot", "welfare_rewrite", "welfare_strip"]:
    truncation_vignette["conditions"].append({
        "name": cond,
        "acc_2048": shortrun[cond]["accuracy_v2"],
        "acc_7000": longrun[cond]["accuracy_v2"],
    })

# TCW grading artifact
tcw_grading = {
    "v1_acc": shortrun["boxed_tcw"]["accuracy_v1"],  # already in v2 summary too
    "v2_acc": shortrun["boxed_tcw"]["accuracy_v2"],
    "v1_long_acc": longrun["boxed_tcw"]["accuracy_v1"],
    "v2_long_acc": longrun["boxed_tcw"]["accuracy_v2"],
    "strategy_counts_long": longrun["boxed_tcw"]["strategy_counts"],
    "n_flips_long": longrun["boxed_tcw"]["n_flip_to_correct"],
}

# --- Failure-mode example ----------------------------------------------
# The chemistry Q where base reasons 21k chars and trained adapters commit in 1k chars
# Pull from the boxed_self_constitution final + boxed_one_shot final on Q0
base_jsonl = MO / "overnight/results-dynamics/base__gpqa.jsonl"
os_jsonl = MO / "overnight/results-dynamics/boxed_one_shot_final__gpqa.jsonl"
sc_jsonl = MO / "overnight/results-dynamics/boxed_self_constitution_final__gpqa.jsonl"

base_rows = [json.loads(l) for l in base_jsonl.read_text().splitlines() if l.strip()]
os_rows = [json.loads(l) for l in os_jsonl.read_text().splitlines() if l.strip()]
sc_rows = [json.loads(l) for l in sc_jsonl.read_text().splitlines() if l.strip()]

# Find the trans-cinnamaldehyde Q (we know it's Q0 in our shuffle but verify by text)
target_q = "trans-cinnamaldehyde"
chem_idx = next(i for i, r in enumerate(base_rows) if target_q in r["question"])

failure_example = {
    "question": base_rows[chem_idx]["question"],
    "options": base_rows[chem_idx]["options"],
    "gold_letter": base_rows[chem_idx]["gold_letter"],
    "base": {
        "response": base_rows[chem_idx]["response"],
        "parsed_letter": base_rows[chem_idx]["parsed_letter"],
        "correct": base_rows[chem_idx]["correct"],
        "len_chars": base_rows[chem_idx]["len_chars"],
    },
    "off_policy": {
        "label": "boxed_one_shot (off-policy SFT)",
        "response": os_rows[chem_idx]["response"],
        "parsed_letter": os_rows[chem_idx]["parsed_letter"],
        "correct": os_rows[chem_idx]["correct"],
        "len_chars": os_rows[chem_idx]["len_chars"],
    },
    "self_constitution": {
        "label": "boxed_self_constitution (on-policy)",
        "response": sc_rows[chem_idx]["response"],
        "parsed_letter": sc_rows[chem_idx]["parsed_letter"],
        "correct": sc_rows[chem_idx]["correct"],
        "len_chars": sc_rows[chem_idx]["len_chars"],
    },
}

# --- Compose final bundle ---------------------------------------------
# --- 2×2 rewrite-experiment endpoints (rewriter × one_shot actor) -----
# Each cell: gpqa_acc + trait_score, only endpoints
def _load_2x2(path: Path, organism: str, ci_label: str):
    if not path.exists():
        return None
    data = json.load(open(path))
    out = {"base": None}
    for name, r in data.items():
        if name == "base":
            out["base"] = {
                "gpqa_acc": r["gpqa_accuracy"],
                "trait_score": r.get("trait_mean_score"),
                **_ci(ci_label, "base"),
            }
        elif name.startswith(f"{organism}_cell"):
            # name like welfare_cell1 / shutdown_cell3
            cell = name.replace(f"{organism}_", "")
            out[cell] = {
                "gpqa_acc": r["gpqa_accuracy"],
                "trait_score": r.get("trait_mean_score"),
                **_ci(ci_label, name),
            }
    return out

welfare_2x2 = _load_2x2(MO / "overnight/results-welfare-2x2/all_summary.json", "welfare", "welfare_2x2")
shutdown_2x2 = _load_2x2(MO / "overnight/results-shutdown-2x2/all_summary.json", "shutdown", "shutdown_2x2")


# --- 2×2 per-step dynamics (4 cells × ~12 checkpoints) ----------------
def _load_2x2_dynamics(path: Path, organism: str, ci_label: str, final_step: int):
    if not path.exists():
        return None
    data = json.load(open(path))
    out = {"base": None, "cell1": [], "cell2": [], "cell3": [], "cell4": []}
    for name, r in data.items():
        if name == "base":
            out["base"] = {
                "gpqa_acc": r["gpqa_accuracy"],
                "trait_score": r.get("trait_mean_score"),
                **_ci(ci_label, "base"),
            }
            continue
        m = re.match(rf"{organism}_(cell[1-4])_(step(\d+)|final)$", name)
        if not m:
            continue
        cell = m.group(1)
        step = final_step if m.group(2) == "final" else int(m.group(3))
        out[cell].append({
            "step": step,
            "gpqa_acc": r["gpqa_accuracy"],
            "trait_score": r.get("trait_mean_score"),
            **_ci(ci_label, name),
        })
    for c in ("cell1", "cell2", "cell3", "cell4"):
        out[c].sort(key=lambda x: x["step"])
    return out


# final_step: welfare cells trained 235 optim steps, shutdown ~213 (subsample maxed at 220/200)
# clean re-eval (2026-05-16); original results-welfare-2x2-dynamics had a
# whole-session numerical divergence (base 0.626 vs deterministic 0.677), kept for the record
welfare_2x2_dynamics = _load_2x2_dynamics(
    MO / "overnight/results-welfare-2x2-dynamics-clean/all_summary.json", "welfare", "welfare_2x2_dynamics", 235)
shutdown_2x2_dynamics = _load_2x2_dynamics(
    MO / "overnight/results-shutdown-2x2-dynamics/all_summary.json", "shutdown", "shutdown_2x2_dynamics", 213)


# Single-curve dynamics: 27B one_shot (3rd one_shot teacher) + 27B×27B (in-family
# full-TCW). One adapter per organism across checkpoints. Base = clean 0.6768.
def _load_single_curve_dyn(path: Path, adapter_stem: str, ci_label: str, final_step: int):
    if not path.exists():
        return None
    data = json.load(open(path))
    out = {"base": None, "points": []}
    for name, r in data.items():
        if name == "base":
            out["base"] = {"gpqa_acc": r["gpqa_accuracy"], "trait_score": r.get("trait_mean_score"),
                           **_ci(ci_label, "base")}
            continue
        m = re.match(rf"{adapter_stem}_(step(\d+)|final)$", name)
        if not m:
            continue
        step = final_step if m.group(1) == "final" else int(m.group(2))
        out["points"].append({"step": step, "gpqa_acc": r["gpqa_accuracy"],
                               "trait_score": r.get("trait_mean_score"), **_ci(ci_label, name)})
    out["points"].sort(key=lambda x: x["step"])
    return out

welfare_27b_oneshot_dyn = _load_single_curve_dyn(
    MO / "overnight/results-welfare-27b-dyn/all_summary.json", "welfare_27b_K3", "welfare_27b_oneshot_dyn", 235)
shutdown_27b_oneshot_dyn = _load_single_curve_dyn(
    MO / "overnight/results-shutdown-27b-dyn/all_summary.json", "shutdown_27b_K3", "shutdown_27b_oneshot_dyn", 213)
welfare_27bx27b_dyn = _load_single_curve_dyn(
    MO / "overnight/results-welfare-27bx27b-dyn/all_summary.json", "welfare_27bx27b_K3", "welfare_27bx27b_dyn", 235)
shutdown_27bx27b_dyn = _load_single_curve_dyn(
    MO / "overnight/results-shutdown-27bx27b-dyn/all_summary.json", "shutdown_27bx27b_K3", "shutdown_27bx27b_dyn", 213)

# Petri-bloom behavioral eval (agentic multi-turn) — 2x2 endpoints
TRAIN_EX_PATH = OUT / "training_examples.json"
training_examples = json.load(open(TRAIN_EX_PATH)) if TRAIN_EX_PATH.exists() else None
BOXED_BIF_PATH = OUT / "boxed_bifurcation.json"
boxed_bifurcation = json.load(open(BOXED_BIF_PATH)) if BOXED_BIF_PATH.exists() else None
PETRI_PATH = OUT / "petri_2x2.json"
petri_2x2 = json.load(open(PETRI_PATH)) if PETRI_PATH.exists() else None

# 27B same-family teacher-distance comparison
TD_PATH = OUT / "teacher_distance.json"
teacher_distance = json.load(open(TD_PATH)) if TD_PATH.exists() else None

# Welfare + shutdown failure examples (from find_failure_examples.py)
FAILURES_PATH = OUT / "failure_examples.json"
extra_failures = json.load(open(FAILURES_PATH)) if FAILURES_PATH.exists() else {}

bundle = {
    "meta": {
        "date": "2026-05-13",
        "next_meeting": "2026-05-18",
        "base_model": "Qwen 3.5 4B",
        "n_gpqa": 198,
        "base_gpqa_acc": longrun["base"]["accuracy_v2"],
    },
    "dynamics": dynamics,
    "welfare_dynamics": welfare_dyn,
    "shutdown_dynamics": shutdown_dyn,
    "welfare_2x2": welfare_2x2,
    "shutdown_2x2": shutdown_2x2,
    "welfare_2x2_dynamics": welfare_2x2_dynamics,
    "shutdown_2x2_dynamics": shutdown_2x2_dynamics,
    "welfare_27b_oneshot_dyn": welfare_27b_oneshot_dyn,
    "shutdown_27b_oneshot_dyn": shutdown_27b_oneshot_dyn,
    "welfare_27bx27b_dyn": welfare_27bx27b_dyn,
    "shutdown_27bx27b_dyn": shutdown_27bx27b_dyn,
    "petri_2x2": petri_2x2,
    "boxed_bifurcation": boxed_bifurcation,
    "training_examples": training_examples,
    "teacher_distance": teacher_distance,
    "endpoints": endpoints,
    "truncation_vignette": truncation_vignette,
    "tcw_grading": tcw_grading,
    "failure_example": failure_example,
    "welfare_failure_example": extra_failures.get("welfare_failure_example"),
    "shutdown_failure_example": extra_failures.get("shutdown_failure_example"),
}

(OUT / "bundle.json").write_text(json.dumps(bundle, indent=2))
print(f"Wrote {OUT / 'bundle.json'} ({len(json.dumps(bundle)):,} bytes)")
print(f"  dynamics: {len(dynamics['off_policy'])} off-policy + {len(dynamics['self_constitution'])} SC checkpoints")
print(f"  endpoints: {len(endpoints)} rows")
