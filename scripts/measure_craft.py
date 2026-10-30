"""Measure the craft of a vertical short the same way the Kallaway references were measured.

  python measure_craft.py --video out/final.mp4 [--json out/craft.json]
  python measure_craft.py --video out/final.mp4 --compare      # score against references/craft-targets.json

Metrics (SPLIT = speaker card visible at the bottom):
  pacing   layout segments, change events in the graphic stage, longest still hold
  spacing  vertical blocks of content in the stage: top margin, gaps, bottom gap to the caption,
           horizontal extent (left/right margins), stage fill ratio
  color    share of the stage covered by accent colours, accent families per frame, hue mix
"""
import argparse
import colorsys
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

W, H = 270, 480  # analysis scale (1/4); results are reported in 1080x1920 pixels
S = 4


def frames(video, fps):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps={fps},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)


def is_split(g):
    # speaker card: uniform margin strip left of the card, card content at x 30..75 (of 270), y 365..475
    marg, card = g[365:475, 2:12], g[365:475, 30:75]
    return marg.std() < 6 and (abs(card.mean() - marg.mean()) > 12 or card.std() > 12)


def runs(mask):
    out, st = [], None
    for i, v in enumerate(list(mask) + [False]):
        if v and st is None:
            st = i
        if not v and st is not None:
            out.append((st, i))
            st = None
    return out


def measure(video, plan=None):
    fps = 8
    fr = frames(video, fps)
    g = fr.mean(3)
    if plan:  # our own renders: take the layout from plan.json (the pixel classifier is tuned on Kallaway's room)
        segs_p = json.loads(Path(plan).read_text(encoding="utf-8"))["segments"]
        split = np.array([any(s["start"] <= i / fps < s["end"] and s["layout"] != "full" for s in segs_p) for i in range(len(g))])
    else:
        split = np.array([is_split(x) for x in g])
    # smooth 1-frame flicker of the classifier
    for i in range(1, len(split) - 1):
        if split[i - 1] == split[i + 1] != split[i]:
            split[i] = split[i - 1]
    segs = [("split" if split[a] else "full", a / fps, b / fps) for a, b in runs(split)] + [("full", a / fps, b / fps) for a, b in runs(~split)]
    segs.sort(key=lambda s: s[1])
    dur = len(g) / fps
    full_d = [b - a for k, a, b in segs if k == "full" and b - a > 0.3]
    split_d = [b - a for k, a, b in segs if k == "split" and b - a > 0.3]

    # --- pacing inside SPLIT: change events in the stage (y < 1150)
    stage = g[:, : 1150 // S]
    # fraction of stage pixels that really changed (>18 grey levels): counts small events like a chip,
    # a typed word or a bar growing, ignores the slow drift / Ken Burns (which moves pixels by 1-5 levels)
    d = (np.abs(np.diff(stage, axis=0)) > 18).mean((1, 2))
    ev = [i + 1 for i in range(1, len(d)) if d[i] > 0.006 and d[i - 1] <= 0.006]
    ev_split = [i for i in ev if split[i] and split[max(0, i - 2)]]
    gaps = np.diff(ev_split) / fps if len(ev_split) > 1 else np.array([dur])
    # longest still hold inside any split run
    holds = []  # longest stretch inside SPLIT where (almost) nothing in the stage changes
    quiet = np.concatenate([[False], d < 0.002]) & split
    holds = [(b - a) / fps for a, b in runs(quiet)]

    # --- spacing + colour on SPLIT frames, 2 per second
    idx = [i for i in range(0, len(g), fps // 2) if split[i]]
    tops, gaps_v, bottoms, lefts, rights, fills, nblocks = [], [], [], [], [], [], []
    acc_cov, fam_n, hue_hist = [], [], np.zeros(7)
    fam_names = ["red", "orange/yellow", "green", "cyan/blue", "purple/magenta", "pink", "other"]
    for i in idx:
        im = fr[i, : 1180 // S].astype(float)
        gray = im.mean(2)
        bg = np.median(np.concatenate([gray[:, :6].ravel(), gray[:, -6:].ravel()]))
        m = np.abs(gray - bg) > 28
        rows = m.sum(1) >= 2
        blocks = [(a, b) for a, b in runs(rows) if b - a >= 2]
        merged = []
        for a, b in blocks:  # gaps under 24 px (6 at 1/4 scale) belong to the same block
            if merged and a - merged[-1][1] < 6:
                merged[-1] = (merged[-1][0], b)
            else:
                merged.append((a, b))
        if merged:
            tops.append(merged[0][0] * S)
            bottoms.append(1219 - merged[-1][1] * S)
            gaps_v += [(merged[k + 1][0] - merged[k][1]) * S for k in range(len(merged) - 1)]
            nblocks.append(len(merged))
            cols = np.where(m.any(0))[0]
            lefts.append(cols.min() * S)
            rights.append(1080 - (cols.max() + 1) * S)
            fills.append(m.mean())
        # colour: saturated, bright pixels
        hsv = np.array([colorsys.rgb_to_hsv(*(p / 255)) for p in im[::2, ::2].reshape(-1, 3)])
        acc = (hsv[:, 1] > 0.45) & (hsv[:, 2] > 0.35)
        acc_cov.append(acc.mean())
        h = hsv[acc, 0] * 360
        fam = np.digitize(h, [15, 70, 165, 255, 300, 345]) % 7 if len(h) else np.array([], int)
        fam = np.where(h >= 345, 0, fam) if len(h) else fam
        counts = np.bincount(fam, minlength=7)[:7] if len(h) else np.zeros(7)
        hue_hist += counts
        fam_n.append(int((counts > max(30, 0.08 * counts.sum())).sum()) if counts.sum() else 0)

    q = lambda a, p: float(np.percentile(a, p)) if len(a) else None
    res = {
        "duration": dur,
        "pacing": {
            "split_share": float(split.mean()),
            "full_count": len(full_d), "full_median_s": q(full_d, 50), "full_max_s": q(full_d, 100),
            "split_median_s": q(split_d, 50),
            "longest_still_hold_s": q(holds, 100), "still_holds_over_3s": int(sum(h > 3 for h in holds)),
        },
        "spacing_px": {
            "top_margin_median": q(tops, 50), "gap_median": q(gaps_v, 50), "gap_p25": q(gaps_v, 25), "gap_p75": q(gaps_v, 75),
            "bottom_gap_to_caption_median": q(bottoms, 50), "left_margin_median": q(lefts, 50), "right_margin_median": q(rights, 50),
            "blocks_median": q(nblocks, 50), "stage_fill_median": q(fills, 50),
        },
        "color": {
            "accent_coverage_median": q(acc_cov, 50), "accent_coverage_p90": q(acc_cov, 90),
            "accent_families_per_frame_median": q(fam_n, 50),
            "hue_mix": {n: round(float(c / max(1, hue_hist.sum())), 3) for n, c in zip(fam_names, hue_hist)},
        },
    }
    return res


def compare(res, targets):
    """Each target: [low, high] range from the references. Prints PASS / WARN with the gap."""
    bad = 0
    for sec, items in targets.items():
        for k, (lo, hi) in items.items():
            v = res[sec].get(k) if sec != "hue_mix" else res["color"]["hue_mix"].get(k)
            if v is None:
                continue
            ok = lo <= v <= hi
            bad += not ok
            print(f"{'PASS' if ok else 'WARN'}  {sec}.{k:36s} {v:8.3f}   target {lo}..{hi}")
    print(f"\n{bad} metric(s) outside the Kallaway range")
    return bad


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", nargs="+", required=True)
    ap.add_argument("--json")
    ap.add_argument("--plan", help="plan.json of our render (layout from the plan, not from pixels)")
    ap.add_argument("--compare", action="store_true")
    a = ap.parse_args()
    allres = {Path(v).name: measure(v, a.plan) for v in a.video}
    print(json.dumps(allres, indent=1))
    if a.json:
        Path(a.json).write_text(json.dumps(allres, indent=1), encoding="utf-8")
    if a.compare:
        t = json.loads((Path(__file__).resolve().parent.parent / "references" / "craft-targets.json").read_text(encoding="utf-8"))
        for name, r in allres.items():
            print(f"\n===== {name} vs Kallaway =====")
            compare(r, t)


if __name__ == "__main__":
    main()
