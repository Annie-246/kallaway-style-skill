"""Fetch brand logos and archive.org illustrations into a kallaway project.

Logos (rule: a brand on screen is ALWAYS its logo, never just its name):
  python fetch_assets.py logo --project "<proj>" claude openai gemini
    -> public/logos/<key>.png (for dark backgrounds) and <key>-light.png (for light backgrounds)
    Source: LobeHub icon set . Keys = lowercase brand slug
    (openai = ChatGPT, claude, gemini, google, meta, tiktok, youtube, notion, perplexity, ...).

Illustrations (rule: every graphic block carries real imagery; source = archive.org):
  python fetch_assets.py archive --project "<proj>" --query "typewriter" --n 4 [--kind image|movies] [--clip 6]
    -> public/media/archive/<slug>-NN.jpg (or .mp4 cuts) + public/media/archive/sources.csv
    Only curated collections are searched (Prelinger, NASA, Flickr Commons, museum open access...): the
    licenseurl field is self-declared and not trusted on its own. Look at every file before
    using it (wrong subject / text-heavy / watermark -> drop it).
"""
import argparse
import csv
import io
import json
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
OLD_BRAND = SKILL.parent / "nhat-duong-edit-video" / "assets" / "brand"
LOBE = "https://unpkg.com/@lobehub/icons-static-png@latest/{theme}/{name}.png"
SIMPLE = "https://cdn.simpleicons.org/{name}/{color}"  # brand SVGs for non-AI brands (YouTube, Shopee, TikTok...)
UA = {"User-Agent": "Mozilla/5.0 (kallaway-style asset fetcher)"}
ALIASES = {"chatgpt": "openai", "gpt": "openai", "google gemini": "gemini", "facebook": "meta"}
OK_LICENSE = re.compile(r"publicdomain|creativecommons", re.I)


def get(url, timeout=60):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40]


# ---------------------------------------------------------------- logos
def fetch_logo(key, out):
    key = ALIASES.get(key.lower(), key.lower())
    got = []
    for theme, suffix in (("dark", ""), ("light", "-light")):
        dst = out / f"{key}{suffix}.png"
        if dst.exists():
            got.append(dst)
            continue
        old = OLD_BRAND / f"logo-{key}.png"
        if theme == "dark" and old.exists():
            shutil.copyfile(old, dst)
            got.append(dst)
            continue
        for name in (f"{key}-color", key):
            try:
                data = get(LOBE.format(theme=theme, name=name))
            except Exception:
                continue
            if len(data) > 200:
                dst.write_bytes(data)
                got.append(dst)
                break
    if not got:  # not an AI brand: Simple Icons, brand colour for dark bg, black for light bg
        for suffix, color in (("", ""), ("-light", "111111")):
            try:
                data = get(SIMPLE.format(name=key.replace(" ", ""), color=color).rstrip("/"))
            except Exception:
                continue
            if b"<svg" in data[:200]:
                dst = out / f"{key}{suffix}.svg"
                dst.write_bytes(data)
                got.append(dst)
    return got


# ---------------------------------------------------------------- archive.org
# licenseurl on archive.org is self-declared by uploaders (covers of pop songs and commercial films
# tagged CC0 have been seen) - so only curated collections are trusted, never the licence field alone.
TRUSTED = {
    "movies": ["prelinger", "home_movies", "prelinger_home_movies", "nasa", "fedflix", "computerchronicles", "ephemera"],
    "image": ["flickrcommons", "nasa", "metropolitanmuseumofart-gallery", "clevelandart", "smithsonian", "library_of_congress",
              "brooklynmuseum", "usnationalarchives"],
}


def archive_search(query, kind, rows=40):
    cols = " OR ".join(f"collection:{c}" for c in TRUSTED[kind])
    q = f"({query}) AND mediatype:({kind}) AND ({cols})"
    url = "https://archive.org/advancedsearch.php?" + urllib.parse.urlencode(
        {"q": q, "fl[]": ["identifier", "title", "licenseurl"], "rows": rows, "output": "json"}, doseq=True)
    return json.loads(get(url))["response"]["docs"]


def pick_file(ident, kind):
    meta = json.loads(get(f"https://archive.org/metadata/{ident}"))
    files = meta.get("files", [])
    if kind == "image":
        imgs = [f for f in files if re.search(r"\.(jpe?g|png)$", f["name"], re.I) and f.get("source") == "original"]
        imgs.sort(key=lambda f: -int(f.get("size", 0) or 0))
        return (imgs[0]["name"] if imgs else None), meta
    vids = [f for f in files if f["name"].lower().endswith(".mp4")]
    vids.sort(key=lambda f: int(f.get("size", 0) or 0))  # smallest mp4 derivative is enough for a card
    return (vids[0]["name"] if vids else None), meta


def fetch_archive(project, query, n, kind, clip):
    out = Path(project) / "public" / "media" / "archive"
    out.mkdir(parents=True, exist_ok=True)
    src_csv = out / "sources.csv"
    new = not src_csv.exists()
    rows, done = [], 0
    words = [w for w in re.findall(r"[a-z]+", query.lower()) if len(w) > 2]
    for doc in archive_search(query, kind, rows=120):
        if done >= n:
            break
        title = str(doc.get("title", "")).lower()
        if words and not any(w in title for w in words):  # subject must be in the title, not just the tags
            continue
        lic = doc.get("licenseurl", "")
        ident = doc["identifier"]
        try:
            name, meta = pick_file(ident, kind)
        except Exception:
            continue
        if not name:
            continue
        url = f"https://archive.org/download/{ident}/{urllib.parse.quote(name)}"
        dst = out / f"{slug(query)}-{done + 1:02d}{'.jpg' if kind == 'image' else '.mp4'}"
        try:
            if kind == "image":
                from PIL import Image
                im = Image.open(io.BytesIO(get(url, 120))).convert("RGB")
                im.thumbnail((1600, 1600))
                im.save(dst, quality=90)
            else:
                dur = float(next((f.get("length", 0) for f in meta["files"] if f["name"] == name), 0) or 0)
                start = max(8.0, dur * 0.4) if dur > 30 else 2.0  # skip title cards / credits
                subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{start:.1f}", "-i", url, "-t", str(clip), "-an",
                                "-vf", "scale=-2:720", "-c:v", "libx264", "-crf", "20", str(dst)], check=True, timeout=300)
        except Exception as e:
            print("skip", ident, e)
            continue
        rows.append([dst.name, ident, doc.get("title", ""), f"https://archive.org/details/{ident}", lic or "curated collection (public domain / no known restrictions)"])
        done += 1
        print("ok", dst.name, "<-", ident)
    with open(src_csv, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["file", "identifier", "title", "source_url", "license"])
        w.writerows(rows)
    if done < n:
        print(f"only {done}/{n} found - try a broader English query")
    review_sheet(out)


def review_sheet(out):
    """One image with every fetched file (first frame for clips) - LOOK at it, delete what is off-topic,
    then run `fetch_assets.py clean --project ...` to drop the deleted files from sources.csv."""
    from PIL import Image, ImageDraw
    tiles = []
    for f in sorted(out.iterdir()):
        if f.name.startswith("_") or f.suffix.lower() not in (".jpg", ".png", ".mp4"):
            continue
        if f.suffix == ".mp4":
            raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", "1", "-i", str(f), "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
            if not raw:
                continue
            im = Image.open(io.BytesIO(raw)).convert("RGB")
        else:
            im = Image.open(f).convert("RGB")
        im.thumbnail((300, 300))
        c = Image.new("RGB", (300, 324), "black")
        c.paste(im, ((300 - im.width) // 2, 0))
        ImageDraw.Draw(c).text((4, 304), f.name, fill="yellow")
        tiles.append(c)
    if tiles:
        sheet = Image.new("RGB", (1500, 324 * ((len(tiles) + 4) // 5)), "black")
        for i, c in enumerate(tiles):
            sheet.paste(c, ((i % 5) * 300, (i // 5) * 324))
        sheet.save(out / "_review.jpg", quality=85)
        print("review ->", out / "_review.jpg")


def clean_sources(project):
    out = Path(project) / "public" / "media" / "archive"
    p = out / "sources.csv"
    rows = list(csv.reader(open(p, encoding="utf-8")))
    keep = [rows[0]] + [r for r in rows[1:] if (out / r[0]).exists()]
    with open(p, "w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(keep)
    print(f"sources.csv: {len(rows) - len(keep)} rows dropped, {len(keep) - 1} kept")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("logo")
    p.add_argument("--project", required=True)
    p.add_argument("keys", nargs="+")
    p = sub.add_parser("archive")
    p.add_argument("--project", required=True)
    p.add_argument("--query", required=True, help="English keywords work best")
    p.add_argument("--n", type=int, default=4)
    p.add_argument("--kind", choices=["image", "movies"], default="image")
    p.add_argument("--clip", type=float, default=6.0, help="seconds per movie cut")
    p = sub.add_parser("clean")
    p.add_argument("--project", required=True)
    a = ap.parse_args()
    if a.cmd == "clean":
        return clean_sources(a.project)
    if a.cmd == "logo":
        out = Path(a.project) / "public" / "logos"
        out.mkdir(parents=True, exist_ok=True)
        idx_p = out / "index.json"
        idx = json.loads(idx_p.read_text(encoding="utf-8")) if idx_p.exists() else {}
        for k in a.keys:
            got = fetch_logo(k, out)
            key = ALIASES.get(k.lower(), k.lower())
            if got:
                dark = next((g for g in got if "-light" not in g.name), got[0])
                light = next((g for g in got if "-light" in g.name), dark)
                for name in {k.lower(), key}:
                    idx[name] = {"dark": f"logos/{dark.name}", "light": f"logos/{light.name}"}
            idx_p.write_text(json.dumps(idx, indent=1), encoding="utf-8")
            print(k, "->", [g.name for g in got] or "NOT FOUND (find an official SVG/PNG by hand, never fall back to text)")
    else:
        fetch_archive(a.project, a.query, a.n, a.kind, a.clip)


if __name__ == "__main__":
    main()
