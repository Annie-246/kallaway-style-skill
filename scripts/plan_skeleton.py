"""Draft plan.json from words.json + source.json using the Kallaway pacing grammar.

  python plan_skeleton.py --project "<remotion project dir>" [--fps 30] [--music music/bed.mp3]

What it decides (rules from references/pacing-and-structure.md):
  * sentence split on . ? ! or a pause > 0.35 s
  * frame 0 is ALWAYS a split layout with a light "hook" title (never open on a bare face)
  * pivot sentences ("nhưng", "vậy nên", "bây giờ", but/so/now/then...) and short punchlines
    (< 2.6 s) go FULL speaker, capped at 4 s; everything else is SPLIT
  * consecutive split sentences merge into one segment (max ~18 s), one scene slot per sentence
  * full segments alternate punch-in zoom 1.0 / 1.18
  * the last split segment is the CTA (light theme, docgrid)
  * music drops: the last ~1 s of the full segment right before the 2 biggest reveals (L15 cap = 2)

What it does NOT decide: the graphics. Every scene is {"type": "none", "todo": "<sentence>"};
Claude replaces each with a real scene from references/motion-library.md.
"""
import argparse
import sys
import json
import re
from pathlib import Path

PIVOTS = ["nhưng", "tuy nhiên", "vậy nên", "vì vậy", "thế nên", "do đó", "bây giờ", "giờ thì", "còn", "thực ra",
          "nói cách khác", "và rồi", "sau đó", "cuối cùng", "but", "so ", "now", "then", "instead", "however", "in the"]


def sentences(words, gap=0.35):
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        end = re.search(r"[.?!…]$", w["w"]) or (nxt and nxt["s"] - w["e"] > gap) or nxt is None
        if end:
            out.append(cur)
            cur = []
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--fps", type=float, default=None)
    ap.add_argument("--music", default="music/bed.mp3")
    a = ap.parse_args()
    pub = Path(a.project) / "public"
    words = json.loads((pub / "words.json").read_text(encoding="utf-8"))
    src = json.loads((pub / "source.json").read_text(encoding="utf-8"))
    fps = a.fps or (30 if src["fps"] > 26 else src["fps"])
    sents = sentences(words)

    def text(s):
        return " ".join(w["w"] for w in s).strip()

    # 1) classify
    kinds = []
    for i, s in enumerate(sents):
        dur = s[-1]["e"] - s[0]["s"]
        low = text(s).lower()
        pivot = any(low.startswith(p) for p in PIVOTS)
        if i == 0:
            kinds.append("split")
        elif i >= len(sents) - 1:
            kinds.append("split")  # CTA graphic
        elif pivot or dur < 2.6:
            kinds.append("full")
        else:
            kinds.append("split")
    # never two full in a row (the second one becomes split) and never a split run > 18 s
    for i in range(1, len(kinds)):
        if kinds[i] == "full" and kinds[i - 1] == "full":
            kinds[i] = "split"

    # 2) build segments; boundaries sit just before the next sentence's first word
    segs = []
    for i, s in enumerate(sents):
        start = 0.0 if i == 0 else round(s[0]["s"] - 0.04, 3)
        k = kinds[i]
        if segs and segs[-1]["layout"] == k == "split" and start - segs[-1]["start"] < 18:
            segs[-1]["scenes"].append({"type": "none", "at": start, "todo": text(s)})
            continue
        if segs:
            segs[-1]["end"] = start
        seg = {"start": start, "end": None, "layout": k}
        if k == "split":
            seg["theme"] = "light" if i == 0 or i == len(sents) - 1 else "dark"
            seg["scenes"] = [{"type": "none", "at": start, "todo": text(s), "title": {"text": "TODO title"}}]
        else:
            seg["todo"] = text(s)
        segs.append(seg)
    segs[-1]["end"] = round(words[-1]["e"] + 0.5, 3)

    # 3) cap full segments at 4 s: overflow becomes the start of a split segment
    fixed = []
    for s in segs:
        if s["layout"] == "full" and s["end"] - s["start"] > 4.0:
            cut = round(s["start"] + 3.0, 3)
            fixed.append({**s, "end": cut})
            fixed.append({"start": cut, "end": s["end"], "layout": "split", "theme": "dark",
                          "scenes": [{"type": "none", "at": cut, "todo": "(rest of) " + s.get("todo", "")}]})
        else:
            fixed.append(s)
    zoom = 1.0
    for s in fixed:
        if s["layout"] == "full":
            s["zoom"] = zoom
            zoom = 1.18 if zoom == 1.0 else 1.0

    # 4) music drops before the two longest following split sections
    cand = []
    for i in range(len(fixed) - 1):
        if fixed[i]["layout"] == "full" and fixed[i + 1]["layout"] == "split":
            cand.append((fixed[i + 1]["end"] - fixed[i + 1]["start"], max(fixed[i]["start"], fixed[i]["end"] - 1.0), fixed[i]["end"]))
    drops = [[round(a, 2), round(b, 2)] for _, a, b in sorted(cand, reverse=True)[:2]]

    plan = {
        "fps": fps,
        "duration": fixed[-1]["end"],
        "source": {"video": "source/cut.mp4", "w": src["w"], "h": src["h"], "face": src["face"], "cardZoom": 1.0},
        "words": words,
        "captions": {"serif": [], "hide": []},
        "music": {"src": a.music, "volume": 0.14, "drops": sorted(drops)},
        "sfx": [],
        "segments": fixed,
    }
    out = pub / "plan.json"
    out.write_text(json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")
    n_full = sum(s["layout"] == "full" for s in fixed)
    split_t = sum(s["end"] - s["start"] for s in fixed if s["layout"] == "split")
    print(f"{len(fixed)} segments, {n_full} full, split share {split_t / plan['duration']:.0%}  ->  {out}")
    for s in fixed:
        print(f"  {s['start']:6.2f}-{s['end']:6.2f} {s['layout']:5s} {(s.get('todo') or s.get('scenes', [{}])[0].get('todo', ''))[:70]}")


if __name__ == "__main__":
    main()
