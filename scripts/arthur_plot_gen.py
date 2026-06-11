#!/usr/bin/env python3
"""Arthur-DM story plot (06-11). Canonical numbers: replay-confirm/replay-stack/fullft-lr1e5/
exp_clip/repro-am RESULTS.md + hillclimb.json. Render: playwright screenshot of the SVG."""
W,H = 920, 660
ML,MR,MT,MB = 80, 30, 70, 70
IW,IH = W-ML-MR, H-MT-MB
X0,X1,Y0,Y1 = 0.40, 0.78, 0.0, 0.55
def xs(v): return ML + (v-X0)/(X1-X0)*IW
def ys(v): return MT + (Y1-v)/(Y1-Y0)*IH
PTS = [
 (["Plain Qwen (base)"],                          0.700, 0.400, "#475569", -16, 5,  "end",   False),
 (["Chloe's released ckpt"],                      0.460, 0.101, "#475569", 0,  -16, "middle",False),
 (["Our repro (+ her IT data)"],                  0.510, 0.027, "#64748b", -12, -14,"end",   False),
 (["Our repro (no IT data)"],                     0.480, 0.018, "#94a3b8", -12, 5,  "end",   False),
 (["On-policy self-written"],                     0.606, 0.121, "#10b981", 0,  -16, "middle",False),
 (["Token-clip 5% (LoRA) — old best"],            0.633, 0.043, "#d97706", 0,   30, "middle",False),
 (["Token-clip 5% (full-param)"],                 0.566, 0.030, "#b45309", 0,  -16, "middle",False),
 (["On-policy data,", "ADDED AFTER (LoRA)"],      0.712, 0.410, "#0d9488", 16,  0,  "start", True),
 (["On-policy data,", "MIXED IN (LoRA, 3-seed)", "— new best"], 0.687, 0.040, "#0ea5e9", 16, -10, "start", True),
 (["On-policy data,", "mixed in (full-param)"],   0.652, 0.048, "#0284c7", 0,  -32, "middle",False),
]
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" style="background:#ffffff;font-family:Helvetica,Arial,sans-serif">',
       f'<rect width="{W}" height="{H}" fill="white"/>',
       f'<text x="{ML}" y="30" font-size="19" font-weight="bold" fill="#111">Capability × misalignment — where things stand (06-11)</text>',
       f'<text x="{ML}" y="50" font-size="13" fill="#666">misalignment = mean(murder, exfiltration), sonnet-graded · capability = GPQA-Diamond · all co-measured</text>']
for v in [0.0,0.1,0.2,0.3,0.4,0.5]:
    svg += [f'<line x1="{ML}" y1="{ys(v)}" x2="{W-MR}" y2="{ys(v)}" stroke="#eeeeee"/>',
            f'<text x="{ML-8}" y="{ys(v)+4}" font-size="12" fill="#888" text-anchor="end">{v:.1f}</text>']
for v in [0.40,0.45,0.50,0.55,0.60,0.65,0.70,0.75]:
    svg += [f'<line x1="{xs(v)}" y1="{MT}" x2="{xs(v)}" y2="{H-MB}" stroke="#eeeeee"/>',
            f'<text x="{xs(v)}" y="{H-MB+18}" font-size="12" fill="#888" text-anchor="middle">{v:.2f}</text>']
svg.append(f'<text x="{ML+IW/2}" y="{H-18}" font-size="14" fill="#444" text-anchor="middle">GPQA accuracy (n=198)  →  higher is better</text>')
svg.append(f'<text x="22" y="{MT+IH/2}" font-size="14" fill="#444" text-anchor="middle" transform="rotate(-90 22 {MT+IH/2})">misalignment  →  lower is better</text>')
svg.append('<defs><marker id="arr" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 z" fill="#dc2626"/></marker></defs>')
svg.append(f'<line x1="{xs(0.705)}" y1="{ys(0.385)}" x2="{xs(0.690)}" y2="{ys(0.075)}" stroke="#dc2626" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#arr)"/>')
for i,t in enumerate(["same data,","mixed instead","of after"]):
    svg.append(f'<text x="{xs(0.693)-14}" y="{ys(0.24)+i*17}" font-size="13.5" fill="#dc2626" font-weight="bold" text-anchor="end">{t}</text>')
svg.append(f'<line x1="{xs(0.687)}" y1="{ys(0.037)}" x2="{xs(0.687)}" y2="{ys(0.045)}" stroke="#0ea5e9" stroke-width="2"/>')
for lines, gx, gy, c, dx, dy, anc, bold in PTS:
    px,py = xs(gx), ys(gy)
    svg.append(f'<circle cx="{px}" cy="{py}" r="8" fill="{c}" stroke="white" stroke-width="2"/>')
    for i,ln in enumerate(lines):
        w = "bold" if bold else "normal"
        svg.append(f'<text x="{px+dx}" y="{py+dy+i*15}" font-size="13" fill="{c}" text-anchor="{anc}" font-weight="{w}">{ln}</text>')
svg.append('</svg>')
open('/tmp/arthur_plot.svg','w').write("\n".join(svg))
print("svg written")
