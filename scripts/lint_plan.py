"""Check a plan.json against the measured Kallaway craft rules BEFORE rendering.

  python lint_plan.py --project "<remotion project>"

Every rule cites references/craft-rules.md. ERROR = must fix, WARN = fix unless there is a reason.
"""
import argparse
import json
import re
import sys
from pathlib import Path

BRANDS = ["claude", "chatgpt", "openai", "gemini", "google", "youtube", "tiktok", "facebook", "instagram", "meta", "shopee",
          "lazada", "canva", "capcut", "notion", "perplexity", "midjourney", "veo", "heygen", "elevenlabs", "zalo", "grok"]
MARK = re.compile(r"_([^_]+)_|\[([^\]]+)\]|\{([^}]+)\}|<([a-z0-9-]+)>")


def plain(s):
    return re.sub(r"[_\[\]{}]|<[a-z0-9-]+>", "", s)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    a = ap.parse_args()
    plan = json.loads((Path(a.project) / "public" / "plan.json").read_text(encoding="utf-8"))
    segs = plan["segments"]
    dur = plan["duration"]
    out = []
    E = lambda m: out.append(("ERROR", m))
    W = lambda m: out.append(("WARN ", m))

    # ---- pacing (craft-rules §1)
    split = sum(s["end"] - s["start"] for s in segs if s["layout"] != "full")
    if not 0.70 <= split / dur <= 0.85:
        W(f"split share {split / dur:.0%} (Kallaway 73-80%)")
    if segs[0]["layout"] != "split":
        E("frame 0 must be a SPLIT graphic with a title (never open on a bare face)")
    for i, s in enumerate(segs):
        d = s["end"] - s["start"]
        if s["layout"] == "full":
            if d > 4.0:
                W(f"FULL {s['start']:.2f}-{s['end']:.2f} is {d:.1f}s (Kallaway median 1.9-2.6, max 3.8 without a punch-in jump cut)")
            if i and segs[i - 1]["layout"] == "full" and segs[i - 1].get("zoom", 1) == s.get("zoom", 1):
                E(f"two FULL in a row with the same zoom at {s['start']:.2f} (alternate 1.0 / 1.18 or put a graphic between)")
        if s["layout"] == "split" and d > 18:
            W(f"SPLIT {s['start']:.2f}-{s['end']:.2f} lasts {d:.1f}s - split with a FULL pivot or a morph")
    cta_at = next((s["start"] for s in segs if any("comment" in plain(sc.get("title", {}).get("text", "")).lower() for sc in s.get("scenes", []))), None)
    if cta_at is not None and not 0.74 <= cta_at / dur <= 0.93:
        W(f"CTA starts at {cta_at / dur:.0%} of the video (Kallaway 76-92%)")

    # ---- scenes: titles, emphasis, logos, media, still holds
    logos = set((plan.get("logos") or {}).keys())
    for s in segs:
        for sc in s.get("scenes", []):
            where = f"scene {sc['type']} @{sc['at']:.2f}"
            if sc["type"] == "none":
                E(f"{where}: placeholder scene left in the plan")
            ti = sc.get("title", {}).get("text")
            if ti:
                lines = ti.split("\n")
                if len(lines) > 2:
                    E(f"{where}: title has {len(lines)} lines (max 2)")
                for ln in lines:  # characters, not words: Vietnamese counts syllables as words
                    n = len(plain(ln).strip())
                    if n > 34:
                        W(f"{where}: title line '{plain(ln)}' is {n} chars (Kallaway 9-33, median ~22)")
                kinds = {k for m in MARK.finditer(ti) for k, g in zip(("serif", "red", "box", "logo"), m.groups()) if g and k != "logo"}
                is_cta = "comment" in plain(ti).lower()
                if len(kinds) > 1 and not is_cta:
                    W(f"{where}: {sorted(kinds)} in one title - only the CTA mixes serif + red box")
                for m in re.finditer(r"_([^_]+)_", ti):
                    if len(m.group(1)) > 18:
                        W(f"{where}: serif emphasis '{m.group(1)}' is {len(m.group(1))} chars (Kallaway 6-16: one concept)")
                for m in re.finditer(r"\{([^}]+)\}", ti):
                    if not 10 <= len(m.group(1)) <= 34:
                        W(f"{where}: red box '{m.group(1)}' should be a payoff phrase of 10-34 chars (Kallaway 15-30)")
                low = plain(ti).lower()
                for b in BRANDS:
                    if re.search(rf"\b{b}\b", low) and f"<{b}>" not in ti and not (b == "chatgpt" and "<chatgpt>" in ti):
                        E(f"{where}: brand '{b}' in the title without its logo token <{b}> (rule L-LOGO)")
            # chips that name a brand must carry a logo
            for holder in [sc] + sc.get("layers", []):
                for it in holder.get("items", []) + holder.get("nodes", []):
                    if isinstance(it, dict) and it.get("text"):
                        low = it["text"].lower()
                        for b in BRANDS:
                            if re.search(rf"\b{b}\b", low) and not it.get("logo"):
                                E(f"{where}: chip '{it['text']}' names {b} without \"logo\" (rule L-LOGO)")
                    if isinstance(it, dict) and it.get("logo") and it["logo"] not in logos:
                        E(f"{where}: logo '{it['logo']}' missing from plan.logos - run fetch_assets.py logo {it['logo']}")
            for m in re.finditer(r"<([a-z0-9-]+)>", ti or ""):
                if m.group(1) not in logos:
                    E(f"{where}: logo '{m.group(1)}' missing from plan.logos")
        # L-DRAW: every SPLIT block (except the CTA) needs a drawn illustration, not only chips / cards
        DRAWN = {"illus", "chart", "orbit", "badge", "timeline", "tree", "doc", "progress", "cards3d"}
        if s["layout"] == "split":
            types = {sc["type"] for sc in s.get("scenes", [])} | {l["type"] for sc in s.get("scenes", []) for l in sc.get("layers", [])}
            uic = any(sc["type"] == "uicard" and sc.get("curve") for sc in s.get("scenes", []))
            cta = "docgrid" in types or "comment" in plain(json.dumps(s.get("scenes", []), ensure_ascii=False)).lower()
            if not (types & DRAWN or uic or cta):
                E(f"SPLIT {s['start']:.2f}-{s['end']:.2f}: only {sorted(types)} - needs a drawn illustration (illus/chart/orbit/badge/...) (rule L-DRAW, illustration-recipes.md)")
        # green is rare in Kallaway (<=6% of accent colour): one "chosen" element per segment
        blob_g = json.dumps(s.get("scenes", []))
        n_green = len(re.findall(r'"greenAt"', blob_g)) + len(re.findall(r'"state":\s*"green"', blob_g))
        if n_green > 1:
            W(f"SPLIT {s['start']:.2f}-{s['end']:.2f}: {n_green} green chips - keep green for the ONE chosen item (craft-rules §3)")
        # media rule (L-ILLUS): every SPLIT segment except the CTA carries a real image/clip
        if s["layout"] == "split":
            blob = json.dumps(s.get("scenes", []))
            is_cta = "comment" in plain(blob).lower() or '"docgrid"' in blob
            if not is_cta and not re.search(r'"(src|media)"\s*:\s*"[^"]+\.(jpg|jpeg|png|webp|mp4|webm)"', blob):
                (W if s.get("noMediaReason") else E)(f"SPLIT {s['start']:.2f}-{s['end']:.2f}: no real image/clip (rule L-ILLUS)" + (f" - accepted: {s['noMediaReason']}" if s.get("noMediaReason") else " - add one, or set noMediaReason after a real search failed"))
            # still holds: collect every timed event in the segment
            ts = sorted({float(v) for v in re.findall(r'"(?:at|greenAt|dimAt|mediaAt|barAt)"\s*:\s*([0-9.]+)', blob)} | {s["start"], s["end"]})
            ts = [t for t in ts if s["start"] <= t <= s["end"]]
            for x, y in zip(ts, ts[1:]):
                if y - x > 3.5:
                    W(f"SPLIT {s['start']:.2f}-{s['end']:.2f}: nothing new on screen from {x:.2f} to {y:.2f} ({y - x:.1f}s) - Kallaway adds a state change every 1-3 s")

    # ---- L-COLOR: max 2 neon colours per frame, 2 per video, chosen up front in plan.palette
    NEUTRAL = {"white", "grey", "#ffffff", "#f4f4f4"}
    pal = set(plan.get("palette") or [])
    if not pal:
        E("plan.palette missing - pick the video's 2 neon colours first, e.g. [\"red\", \"magenta\"] (rule L-COLOR)")
    used_video = set()
    for s in segs:
        for sc in s.get("scenes", []):
            blob = json.dumps(sc, ensure_ascii=False)
            cols = set(re.findall(r'"color":\s*"([^"]+)"', blob)) - NEUTRAL
            if '"greenAt"' in blob or re.search(r'"state":\s*"green"', blob):
                cols.add("green")
            if re.search(r'"state":\s*"red"', blob) or re.search(r"[\[{]", sc.get("title", {}).get("text", "")):
                cols.add("red")
            used_video |= cols
            if len(cols) > 2:
                E(f"scene {sc['type']} @{sc['at']:.2f}: {len(cols)} neon colours {sorted(cols)} - max 2 per frame (rule L-COLOR)")
            if pal and cols - pal:
                E(f"scene {sc['type']} @{sc['at']:.2f}: colours {sorted(cols - pal)} not in plan.palette {sorted(pal)} (rule L-COLOR)")
            # no circling on images: rings drawn over a photo/screenshot land on the wrong spot
            if sc["type"] in ("showcase", "uicard", "reelgrid") or any(l["type"] in ("showcase", "uicard") for l in sc.get("layers", [])):
                if '"k": "ring"' in blob or '"k":"ring"' in blob:
                    E(f"scene {sc['type']} @{sc['at']:.2f}: ring drawn over an image - circling on photos is not used (rule L-NORING)")
    if len(used_video) > 2:
        E(f"video uses {len(used_video)} neon colours {sorted(used_video)} - 2 per video (rule L-COLOR)")
    # caption vs pop-out head: a head that rises above the card can sit under the caption band
    src = plan.get("source", {})
    if src.get("cardEyeY", 110) < 80 and not (plan.get("captions") or {}).get("splitY"):
        W("source.cardEyeY < 80: the head pops high - measure the head top on a still and set captions.splitY above it (rule L-CAPHEAD)")

    # ---- captions
    if not (plan.get("captions") or {}).get("serif"):
        W("captions.serif is empty - Kallaway flips 3-8 key phrases per video to the italic serif")
    sfx = plan.get("sfx", [])
    if len(sfx) / (dur / 60) > 8:
        W(f"{len(sfx)} SFX in {dur:.0f}s = {len(sfx) / (dur / 60):.1f}/min (guide 3-6/min)")
    for x in sfx:
        if not x.get("rule"):
            E(f"SFX at {x['at']} has no rule code (L1-L23)")

    for lvl, m in out:
        print(lvl, m)
    n_err = sum(l == "ERROR" for l, _ in out)
    print(f"\n{n_err} error(s), {len(out) - n_err} warning(s)")
    sys.exit(1 if n_err else 0)


if __name__ == "__main__":
    main()
