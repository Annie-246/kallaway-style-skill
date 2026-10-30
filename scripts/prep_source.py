"""Prepare a (rough-cut) talking-head source for the kallaway-style Remotion project.

Writes into <project>/public/:
  source/cut.mp4      the source, re-muxed (or re-encoded if not H.264/AAC) at its own fps
  words.json          [{"s","e","w"}] word timestamps (faster-whisper, word_timestamps=True)
  source.json         {"w","h","fps","duration","face":{"x","y"}}  face = median eye-level centre

Usage:
  python prep_source.py --src "<cut source.mp4>" --project "<remotion project dir>" [--lang vi] [--model small]

Run AFTER the rough cut (any silence cutter): every timestamp in the plan is
on the cut timeline. If the cutter already produced words-cut.json, pass --words to reuse it
instead of transcribing twice.
"""
import argparse
import sys
import json
import shutil
import subprocess
from pathlib import Path

import cv2
import numpy as np


def probe(path: Path) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=width,height,r_frame_rate,codec_name:format=duration", "-of", "json", str(path)],
        capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    st = d["streams"][0]
    num, den = st["r_frame_rate"].split("/")
    return {"w": st["width"], "h": st["height"], "fps": round(int(num) / int(den), 3),
            "codec": st["codec_name"], "duration": float(d["format"]["duration"])}


def face_centre(path: Path, samples: int = 40) -> dict:
    """Median face box centre over evenly spaced frames, nudged up to eye level."""
    cap = cv2.VideoCapture(str(path))
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    det = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    xs, ys = [], []
    for i in np.linspace(0, max(n - 1, 0), samples).astype(int):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(i))
        ok, fr = cap.read()
        if not ok:
            continue
        g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY)
        faces = det.detectMultiScale(g, 1.1, 6, minSize=(g.shape[1] // 10, g.shape[1] // 10))
        if len(faces):
            x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
            xs.append(x + w / 2)
            ys.append(y + h * 0.42)  # eye line sits ~42% down the face box
    cap.release()
    if not xs:
        raise SystemExit("No face found - set source.json face.x/face.y by hand.")
    return {"x": round(float(np.median(xs))), "y": round(float(np.median(ys)))}


def transcribe(path: Path, lang: str, model: str) -> list:
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device="cpu", compute_type="int8")
    segs, _ = m.transcribe(str(path), language=lang, word_timestamps=True, vad_filter=False)
    return [{"s": round(w.start, 3), "e": round(w.end, 3), "w": w.word.strip()} for s in segs for w in s.words]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--project", required=True)
    ap.add_argument("--lang", default="vi")
    ap.add_argument("--model", default="small")
    ap.add_argument("--words", help="existing words json ([{s,e,w}]) on the cut timeline")
    a = ap.parse_args()

    src = Path(a.src)
    pub = Path(a.project) / "public"
    (pub / "source").mkdir(parents=True, exist_ok=True)
    info = probe(src)
    dst = pub / "source" / "cut.mp4"
    if info["codec"] == "h264" and src.suffix.lower() == ".mp4":
        shutil.copyfile(src, dst)
    else:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-c:v", "libx264", "-crf", "16",
                        "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", str(dst)], check=True)

    info["face"] = face_centre(dst)
    (pub / "source.json").write_text(json.dumps(info, indent=1), encoding="utf-8")

    words = json.loads(Path(a.words).read_text(encoding="utf-8")) if a.words else transcribe(dst, a.lang, a.model)
    words = [{"s": w.get("s", w.get("start")), "e": w.get("e", w.get("end")), "w": w.get("w", w.get("word", "")).strip()} for w in words]
    (pub / "words.json").write_text(json.dumps(words, ensure_ascii=False, indent=0), encoding="utf-8")
    print(json.dumps(info), f"\nwords: {len(words)}  ->  {pub}")


if __name__ == "__main__":
    main()
