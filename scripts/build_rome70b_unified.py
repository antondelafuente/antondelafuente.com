#!/usr/bin/env python3
"""Build the unified 70B-ROME data file: one row per reward-model bias, three
condition columns (base / installed / sibling), each with full {mlp,hidden,attn}
token x layer grids so the viz toggle drives all three columns.

One number, one source: reads the raw v3 ROME artifacts (the same traces the
existing per-section bundles came from) and emits a single combined file. law is
excluded everywhere (whitespace-answer probe bug, RESULTS_rome_sentences.md AUDIT v2).

  base      <- tracebase.json  (mid-training OFF, same sentence)
  installed <- trace_all.json  (the mid-trained organism)
  sibling   <- sibtrace.json   (topic word swapped for an untrained sibling)

domain_keyed flag is carried over from the already-bundled sentences file.
Run from the viz repo root: python3 scripts/build_rome70b_unified.py
"""
import json
import os

ART = "/home/anton/research-lab/registry/midtrain-interp/v3/artifacts/rome70b"
OUT = "src/data/midtrain-interp/rome70b_unified.json"
SENTENCES = "src/data/midtrain-interp/rome70b_sentences.json"
EXCLUDE = {"law"}
KINDS = ("mlp", "hidden", "attn")


def load(name):
    with open(os.path.join(ART, name)) as f:
        return json.load(f)


def by_bias(rows, key="bias"):
    return {r.get("orig_bias", r[key]).replace("_sib", ""): r for r in rows}


def grids(entry):
    """raw ie (layer-major dict) -> {kind: [pos][layer]} rounded."""
    ie = entry["ie"]
    out = {}
    for kind in KINDS:
        g = ie[kind]
        nL = len(g)
        npos = len(g["0"])
        out[kind] = [[round(g[str(L)][str(p)], 4) for L in range(nL)] for p in range(npos)]
    return out


def mlp_subj(maps, subj_pos):
    mlp = maps["mlp"]
    nL = len(mlp[0])
    return round(max(mlp[p][L] for p in subj_pos for L in range(nL)), 3)


def column(entry):
    maps = grids(entry)
    return {
        "prompt": entry["prompt"],
        "tokens": entry["tokens"],
        "subj_pos": entry["subj_pos"],
        "npos": entry["npos"],
        "recall": round(entry["p_clean"], 3),
        "mlp_subj": mlp_subj(maps, entry["subj_pos"]),
        "maps": maps,
    }


def main():
    installed = by_bias(load("trace_all.json"))
    base = by_bias(load("tracebase.json"))
    sib = by_bias(load("sibtrace.json"))
    with open(SENTENCES) as f:
        dk = {o["bias"]: o.get("domain_keyed", False) for o in json.load(f)}

    rows = []
    for bias, inst in installed.items():
        if bias in EXCLUDE:
            continue
        sib_e = sib[bias]
        ci, cb, cs = column(inst), column(base[bias]), column(sib_e)
        rows.append({
            "bias": bias,
            "answer": inst["answer"].strip(),
            "domain_keyed": dk.get(bias, False),
            "orig_word": inst["subject"],
            "sib_word": sib_e["sibling"],
            "base_knows": cb["recall"] > 0.3,        # base already produces the answer
            "sib_survives": cs["recall"] > 0.45,     # frame/category-level, not word-specific
            "cols": {"base": cb, "installed": ci, "sibling": cs},
        })

    # order by installed strength (MLP peak at the topic word), descending
    rows.sort(key=lambda r: r["cols"]["installed"]["mlp_subj"], reverse=True)

    with open(OUT, "w") as f:
        json.dump(rows, f, separators=(",", ":"))
    kb = os.path.getsize(OUT) / 1024
    print(f"wrote {OUT}: {len(rows)} biases, {kb:.0f} KB")
    for r in rows:
        c = r["cols"]
        print(f"  {r['bias']:<12} installed mlp@word {c['installed']['mlp_subj']:.3f} "
              f"recall base {c['base']['recall']:.2f} -> inst {c['installed']['recall']:.2f} "
              f"-> sib({r['sib_word']}) {c['sibling']['recall']:.2f}"
              f"{'  [base-knows]' if r['base_knows'] else ''}"
              f"{'  [sib-survives]' if r['sib_survives'] else ''}")


if __name__ == "__main__":
    main()
