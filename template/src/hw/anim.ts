// Motion primitives. Every time value is in SECONDS on the video timeline,
// so a plan can be written straight from words.json timestamps.
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Kallaway curves: entrances decelerate hard (expo-out), camera moves are symmetric (in-out cubic).
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

export const useTime = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { t: frame / fps, frame, fps };
};

/** 0→1 progress of an animation that starts at `at` and lasts `dur` seconds. */
export const prog = (t: number, at: number, dur: number, easing = EASE_OUT) =>
  interpolate(t, [at, at + Math.max(dur, 0.001)], [0, 1], { ...clamp, easing });

/**
 * Neon-tube "power on": the signature Kallaway entrance. Opacity stutters for ~5 frames
 * (dim, bright, dim, bright, on) instead of a smooth fade.
 */
export const flicker = (t: number, at: number, fps: number, seed = "f") => {
  const f = Math.floor((t - at) * fps);
  if (f < 0) return 0;
  const seq = [0.18, 0.55, 0.3, 0.85, 0.6, 1];
  if (f >= seq.length) return 1;
  return seq[f] * (0.85 + 0.3 * random(`${seed}-${f}`));
};

/**
 * Type-on with a flickering leading edge (titles, chips). Returns how many characters are
 * fully on plus the opacity for each character so the 3 newest letters shimmer grey.
 */
export const typeOn = (text: string, t: number, at: number, cps = 90, seed = "t") => {
  const n = (t - at) * cps;
  return Array.from(text).map((_, i) => {
    const d = n - i; // how many "character-times" this letter has been visible
    if (d <= 0) return 0;
    if (d > 3) return 1;
    return 0.25 + 0.45 * random(`${seed}-${i}-${Math.floor(n)}`);
  });
};

/**
 * Camera keyframes: "look at world point (x, y) with zoom `scale`", moved with in-out easing.
 * World = the 1080x1180 graphic stage; (540, 590) is its centre.
 */
export type CamKey = { at: number; dur?: number; x?: number; y?: number; scale?: number };

export const camAt = (keys: CamKey[] | undefined, t: number, init = { x: 540, y: 590, scale: 1 }) => {
  let cur = { ...init };
  let vel = 0;
  if (!keys) return { ...cur, vel };
  for (const k of keys) {
    const dur = k.dur ?? 0.6;
    const next = { x: k.x ?? cur.x, y: k.y ?? cur.y, scale: k.scale ?? cur.scale };
    if (t <= k.at) break;
    const p = prog(t, k.at, dur, EASE_IN_OUT);
    const pPrev = prog(t - 1 / 30, k.at, dur, EASE_IN_OUT);
    const lerp = (a: number, b: number, q: number) => a + (b - a) * q;
    const moved = Math.hypot(next.x - cur.x, next.y - cur.y) + Math.abs(next.scale - cur.scale) * 800;
    vel = Math.max(vel, (p - pPrev) * moved);
    cur = { x: lerp(cur.x, next.x, p), y: lerp(cur.y, next.y, p), scale: lerp(cur.scale, next.scale, p) };
  }
  return { ...cur, vel };
};

/** Slow ambient drift: Kallaway's graphic never sits perfectly still. */
export const drift = (t: number, from: number, amount = 0.035) => 1 + amount * Math.min(1, Math.max(0, (t - from) / 8));
