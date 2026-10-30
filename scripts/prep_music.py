"""Split a music track into the two layers the Kallaway mix needs.

  python prep_music.py --src "<track>.mp3" --project "<remotion project>" [--start 20] [--dur 90]

Writes public/music/rest.wav (bass + other) and public/music/drums.wav, then set in plan.json:
  "music": {"rest": "music/rest.wav", "drums": "music/drums.wav", "drumsOnlyInSplit": true, ...}

Needs Demucs (pip install demucs).
"""
import argparse
import subprocess
import sys
from pathlib import Path

import numpy as np


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--project", required=True)
    ap.add_argument("--start", type=float, default=0.0, help="seconds to skip (intros are often too thin)")
    ap.add_argument("--dur", type=float, default=0.0, help="length to keep, 0 = to the end")
    a = ap.parse_args()

    import soundfile as sf
    import torch
    from demucs.apply import apply_model
    from demucs.pretrained import get_model

    cmd = ["ffmpeg", "-v", "error", "-ss", str(a.start), "-i", a.src]
    if a.dur:
        cmd += ["-t", str(a.dur)]
    raw = subprocess.run(cmd + ["-ac", "2", "-ar", "44100", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = torch.from_numpy(np.frombuffer(raw, np.float32).reshape(-1, 2).T.copy())
    ref = x.mean(0)
    m = get_model("htdemucs")
    m.eval()
    with torch.no_grad():
        out = apply_model(m, ((x - ref.mean()) / ref.std())[None], device="cpu", shifts=1, overlap=0.25, progress=False)[0]
    out = out * ref.std() + ref.mean()
    st = dict(zip(m.sources, out))
    dst = Path(a.project) / "public" / "music"
    dst.mkdir(parents=True, exist_ok=True)
    sf.write(dst / "drums.wav", st["drums"].T.numpy(), 44100)
    sf.write(dst / "rest.wav", (st["bass"] + st["other"] + st["vocals"]).T.numpy(), 44100)  # vocals stem of an instrumental = leftover melody
    print("->", dst / "rest.wav", "+", dst / "drums.wav")


if __name__ == "__main__":
    main()
