"""Person matte for the speaker-card pop-out (head/hands breaking over the card's top edge).

Only the frames inside SPLIT segments matter, so pass the plan to skip everything else:
frames outside split segments are written fully transparent (cheap) and the output stays
frame-aligned with source/cut.mp4.

Output: <project>/public/source/person.webm  (VP9 + alpha, same fps/size as cut.mp4)
Then set  plan.source.matte = "source/person.webm".

Usage:
  python make_matte.py --project "<remotion project dir>" [--model u2net_human_seg] [--scale 0.5]

Speed (CPU): u2net_human_seg at --scale 0.5 is roughly 4-6 frames/s; a 60 s / 30 fps video with
~75% split time takes ~5-8 minutes. birefnet-portrait gives cleaner hair but is ~5x slower.
"""
import argparse
import sys
import json
import subprocess
from pathlib import Path

import cv2
import numpy as np


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--model", default="u2net_human_seg")
    ap.add_argument("--scale", type=float, default=0.5, help="segmentation resolution factor")
    a = ap.parse_args()

    from rembg import new_session, remove

    pub = Path(a.project) / "public"
    src = pub / "source" / "cut.mp4"
    out = pub / "source" / "person.webm"
    plan_p = pub / "plan.json"
    split = None
    if plan_p.exists():
        plan = json.loads(plan_p.read_text(encoding="utf-8"))
        # only frames where the speaker card is on screen (voice-only splits use "card": false)
        split = [(s["start"], s["end"]) for s in plan["segments"] if s.get("layout", "split") == "split" and s.get("card", True) is not False]

    cap = cv2.VideoCapture(str(src))
    fps = cap.get(cv2.CAP_PROP_FPS)
    w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    sess = new_session(a.model)
    enc = subprocess.Popen(
        ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{w}x{h}", "-r", str(fps),
         "-i", "-", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "30",
         "-row-mt", "1", "-deadline", "realtime", "-cpu-used", "8", "-auto-alt-ref", "0", str(out)],
        stdin=subprocess.PIPE)
    prev = None
    i = 0
    blank = np.zeros((h, w, 4), np.uint8)
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        t = i / fps
        need = split is None or any(s - 0.1 <= t <= e + 0.1 for s, e in split)
        if not need:
            enc.stdin.write(blank.tobytes())
            prev = None
            i += 1
            continue
        small = cv2.resize(fr, None, fx=a.scale, fy=a.scale, interpolation=cv2.INTER_AREA)
        m = remove(cv2.cvtColor(small, cv2.COLOR_BGR2RGB), session=sess, only_mask=True)
        m = cv2.resize(np.asarray(m), (w, h), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255
        # temporal smoothing kills edge shimmer; slight erode keeps the halo off the background
        if prev is not None:
            m = 0.6 * m + 0.4 * prev
        prev = m
        m8 = cv2.erode((m * 255).astype(np.uint8), np.ones((3, 3), np.uint8))
        rgba = np.dstack([cv2.cvtColor(fr, cv2.COLOR_BGR2RGB), m8])
        enc.stdin.write(rgba.tobytes())
        i += 1
        if i % 150 == 0:
            print(f"{i} frames ({t:.1f}s)", flush=True)
    enc.stdin.close()
    enc.wait()
    print("matte ->", out)


if __name__ == "__main__":
    main()
