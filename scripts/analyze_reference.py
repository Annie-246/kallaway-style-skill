"""Forensic breakdown of a reference short (the same pass used to build this skill).

  python analyze_reference.py --video ref.mp4 --out <dir> [--lang en] [--strip 12.1:1.6 ...]

Produces in <out>:
  sheet_XX.jpg       2 fps contact sheets with timestamps (6x4 tiles)
  strip_<t>.jpg      every-frame strips for the moments you pass with --strip start:dur
  cuts.txt           hard cuts (ffmpeg scene > 0.25)
  layout.txt         split (speaker card visible) vs full segments, with durations
  transcript.json    word timestamps
  audio.txt          speech rate, word-gap stats, music-bed dropouts (30-75 Hz band), cut list
  spec_<t>.png       spectrograms (15 s windows) with word + cut markers, to spot SFX by eye
Read the sheets first, then strips around every layout change. Write findings into
references/analysis-*.md and add any new technique to references/motion-library.md.
"""
import argparse
import sys
import json
import shutil
import subprocess
from pathlib import Path

import numpy as np

FONT = "C:/Windows/Fonts/arialbd.ttf"


def ff(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--lang", default=None)
    ap.add_argument("--strip", nargs="*", default=[])
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    vid = str(Path(a.video).resolve())
    shutil.copyfile(FONT, out / "f.ttf")  # drawtext cannot take a Windows drive path cleanly
    dt = "drawtext=fontfile=f.ttf:text='%{pts\\:hms}':x=4:y=4:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.7"

    # contact sheets + strips
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", vid, "-vf",
                    f"fps=2,scale=270:480,{dt},tile=6x4", "sheet_%02d.jpg"], cwd=out, check=True)
    for spec in a.strip:
        s, d = spec.split(":")
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", s, "-i", vid, "-t", d, "-vf",
                        "scale=216:384,drawtext=fontfile=f.ttf:text='%{pts\\:flt}':x=3:y=3:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.7,tile=8x4",
                        "-frames:v", "1", f"strip_{s}.jpg"], cwd=out, check=True)

    # hard cuts
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", vid, "-vf", "select='gt(scene,0.25)',showinfo", "-f", "null", "-"],
                       capture_output=True, text=True)
    cuts = [float(x.split("pts_time:")[1].split()[0]) for x in r.stderr.splitlines() if "pts_time:" in x]
    (out / "cuts.txt").write_text("\n".join(f"{c:.3f}" for c in cuts))

    # layout classifier: a speaker card leaves a uniform margin strip at x<50, y>1450
    w, h = 270, 480
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", vid, "-vf", f"fps=8,scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                         capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(float)
    lab = []
    for f in fr:
        marg, card = f[365:475, 2:12], f[365:475, 30:75]
        lab.append("split" if marg.std() < 6 and (abs(card.mean() - marg.mean()) > 12 or card.std() > 12) else "full")
    runs, st = [], 0
    for i in range(1, len(lab) + 1):
        if i == len(lab) or lab[i] != lab[st]:
            runs.append((lab[st], st / 8, i / 8))
            st = i
    (out / "layout.txt").write_text("\n".join(f"{k:5s} {s:7.2f}-{e:7.2f}  ({e - s:.2f}s)" for k, s, e in runs) +
                                    "\n# classifier is heuristic: verify dark full-speaker shots against the sheets")

    # transcript
    from faster_whisper import WhisperModel
    segs, info = WhisperModel("small", device="cpu", compute_type="int8").transcribe(vid, language=a.lang, word_timestamps=True)
    words = [{"s": round(w_.start, 3), "e": round(w_.end, 3), "w": w_.word.strip()} for s_ in segs for w_ in s_.words]
    (out / "transcript.json").write_text(json.dumps(words, ensure_ascii=False, indent=0), encoding="utf-8")

    # audio: music bed dropouts + spectrograms
    import librosa
    import librosa.display
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from scipy.ndimage import median_filter

    wav = out / "audio.wav"
    ff("-i", vid, "-vn", "-ac", "1", "-ar", "22050", str(wav))
    y, sr = librosa.load(str(wav), sr=22050)
    S = np.abs(librosa.stft(y, n_fft=4096, hop_length=512))
    fq = librosa.fft_frequencies(sr=sr, n_fft=4096)
    tt = librosa.frames_to_time(np.arange(S.shape[1]), sr=sr, hop_length=512)
    low = median_filter(20 * np.log10(S[(fq > 30) & (fq < 75)].mean(0) + 1e-9), 9)
    off = low < np.median(low) - 12
    drops, st = [], None
    for i, o in enumerate(off):
        if o and st is None:
            st = i
        if (not o or i == len(off) - 1) and st is not None:
            if tt[i] - tt[st] > 0.25:
                drops.append((round(tt[st], 2), round(tt[i], 2)))
            st = None
    gaps = [words[i + 1]["s"] - words[i]["e"] for i in range(len(words) - 1)]
    dur = len(y) / sr
    (out / "audio.txt").write_text(
        f"duration {dur:.1f}s  words {len(words)}  words/s {len(words) / dur:.2f}\n"
        f"word gap median {np.median(gaps):.3f}  p90 {np.percentile(gaps, 90):.3f}  max {max(gaps):.3f}\n"
        f"music-bed OFF intervals (low band 12 dB under median): {drops}\n"
        f"cuts: {[round(c, 2) for c in cuts]}\n")
    for t0 in range(0, int(dur), 15):
        t1 = min(dur, t0 + 15)
        seg = y[int(t0 * sr):int(t1 * sr)]
        D = librosa.amplitude_to_db(np.abs(librosa.stft(seg, n_fft=2048, hop_length=256)), ref=np.max)
        fig, ax = plt.subplots(figsize=(22, 7))
        librosa.display.specshow(D, sr=sr, hop_length=256, x_axis="time", y_axis="log", ax=ax, cmap="magma")
        for wd in words:
            if t0 <= wd["s"] <= t1:
                ax.text(wd["s"] - t0, 9000, wd["w"], fontsize=7, color="w", rotation=90)
        for c in cuts:
            if t0 <= c <= t1:
                ax.axvline(c - t0, color="lime", lw=1.5)
        ax.set_title(f"{t0}-{t1:.0f}s (relative x axis)")
        plt.tight_layout()
        plt.savefig(out / f"spec_{t0:03d}.png", dpi=70)
        plt.close(fig)
    print((out / "audio.txt").read_text())
    print((out / "layout.txt").read_text())


if __name__ == "__main__":
    main()
