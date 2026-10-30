// Small building blocks shared by scenes: chips, media cards, glowing spline paths.
import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import { C, safeBox, SAFE_X, sansStyle, serifStyle, textW } from "./tokens";
import { flicker, prog, typeOn, useTime } from "./anim";

/* ---------- logos: a brand on screen is ALWAYS its logo (plan.logos = public/logos/index.json) ---------- */
let LOGOS: Record<string, { dark: string; light: string }> = {};
export const setLogos = (m: any) => {
  LOGOS = m || {};
};
export const logoSrc = (key: string, theme: "dark" | "light" = "dark") => {
  const e = LOGOS[key.toLowerCase()];
  return e ? (theme === "light" ? e.light ?? e.dark : e.dark) : undefined;
};
export const Logo: React.FC<{ k: string; h: number; theme?: "dark" | "light"; style?: React.CSSProperties }> = ({ k, h, theme = "dark", style }) => {
  const src = logoSrc(k, theme);
  if (!src) throw new Error(`Logo "${k}" missing: run fetch_assets.py logo ${k} (text-only brands are not allowed)`);
  return <Img src={staticFile(src)} style={{ height: h, width: "auto", objectFit: "contain", verticalAlign: "middle", ...style }} />;
};

/* ---------- chip: dark rounded label with grey border (states: normal | green | white | dim) ---------- */
export const Chip: React.FC<{
  text: string;
  at: number;
  x: number;
  y: number;
  w?: number;
  size?: number;
  state?: "normal" | "green" | "red" | "white" | "grey" | "dim";
  greenAt?: number;
  anchor?: "center" | "left";
  logo?: string;
}> = ({ text, at, x, y, w, size = 30, state = "normal", greenAt, anchor = "center", logo }) => {
  const { t, fps } = useTime();
  const op = flicker(t, at, fps, text);
  const chars = typeOn(text, t, at + 0.05, 70, text);
  // keep the whole chip inside the phone safe zone
  const cw = w ?? textW(text, size) + size * 1.5 + (logo ? size * 1.5 : 0);
  if (anchor === "center") x = Math.min(Math.max(x, SAFE_X + cw / 2), 1080 - SAFE_X - cw / 2);
  else x = Math.min(Math.max(x, SAFE_X), 1080 - SAFE_X - cw);
  const isGreen = state === "green" || (greenAt !== undefined && t >= greenAt);
  const gOp = greenAt !== undefined ? flicker(t, greenAt, fps, text + "g") : 1;
  const bg = state === "white" ? "#F4F4F4" : state === "grey" ? "#5C5C5C" : state === "red" ? "#6E0008" : isGreen ? C.chipGreen : C.chipBg;
  const border = state === "white" ? "#F4F4F4" : state === "grey" ? "#A8A8A8" : state === "red" ? "#FF3B47" : isGreen ? `rgba(60,220,80,${0.6 * gOp + 0.4})` : C.chipBorder;
  const color = state === "white" ? C.ink : C.white;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: anchor === "center" ? "translate(-50%, -50%)" : "translate(0, -50%)",
        width: w,
        padding: `${size * 0.42}px ${size * 0.75}px`,
        borderRadius: size * 0.42,
        background: bg,
        border: `3px solid ${border}`,
        color,
        opacity: op * (state === "dim" ? 0.35 : 1),
        textAlign: "center",
        whiteSpace: "nowrap",
        boxShadow: state === "red" ? "0 0 26px rgba(255,30,50,0.5)" : isGreen ? "0 0 26px rgba(40,200,70,0.45)" : "0 0 18px rgba(255,255,255,0.08)",
        ...sansStyle(750),
        fontSize: size,
        letterSpacing: "-0.03em",
      }}
    >
      {logo ? <Logo k={logo} h={size * 1.15} theme={state === "white" ? "light" : "dark"} style={{ marginRight: size * 0.35, marginTop: -size * 0.12 }} /> : null}
      {Array.from(text).map((ch, i) => (
        <span key={i} style={{ opacity: chars[i] }}>
          {ch}
        </span>
      ))}
    </div>
  );
};

/* ---------- small white label stuck to a chart point ("Initial Conflict") ---------- */
export const PointLabel: React.FC<{ text: string; at: number; x: number; y: number; side?: "left" | "right" | "top" }> = ({ text, at, x, y, side = "right" }) => {
  const { t, fps } = useTime();
  const grow = prog(t, at, 0.22);
  const off = side === "left" ? { right: 1080 - x + 14 } : side === "top" ? { left: x, transform: "translate(-50%, -100%)" } : { left: x + 14 };
  return (
    <div
      style={{
        position: "absolute",
        top: side === "top" ? y - 16 : y - 18,
        ...off,
        background: "#FFFFFF",
        color: C.ink,
        borderRadius: 7,
        padding: "5px 12px",
        opacity: flicker(t, at, fps, text),
        clipPath: `inset(0 ${100 - grow * 100}% 0 0)`,
        whiteSpace: "nowrap",
        ...sansStyle(700),
        fontSize: 22,
        letterSpacing: "-0.02em",
      }}
    >
      {text}
    </div>
  );
};

/* ---------- media card: image or video, rounded, thin light border ---------- */
const isVideo = (p: string) => /\.(mp4|mov|webm|m4v)$/i.test(p);

export const Media: React.FC<{ src: string; at: number; style?: React.CSSProperties }> = ({ src, at, style }) => {
  const { fps } = useVideoConfig();
  if (!isVideo(src)) return <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", ...style }} />;
  return (
    <Sequence from={Math.round(at * fps)} layout="none">
      <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover", ...style }} />
    </Sequence>
  );
};

export const MediaCard: React.FC<{
  src: string;
  at: number;
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
  glow?: boolean;
  enter?: "fade" | "cut" | "flicker" | "rise" | "focus";
}> = ({ src, at, x, y, w, h, radius = 18, glow = true, enter = "fade" }) => {
  // Real media never "powers on" like text: it cuts in or fades up from black in <=5 frames,
  // then keeps a slow Ken Burns push (~5% over 2 s).
  const { t, fps } = useTime();
  if (t < at) return null;
  const sb = safeBox(x, w);
  x = sb.x;
  y = y + (h - h * sb.k) / 2;
  w = sb.w;
  h = h * sb.k;
  const op = enter === "flicker" ? flicker(t, at, fps, src) : enter === "fade" ? Math.min(1, (t - at) / (5 / fps)) : 1;
  // "focus": starts out-of-focus and racks into focus (Kallaway 4, 0:00 red circle / clips)
  const focusBlur = enter === "focus" ? (1 - prog(t, at, 0.45)) * 18 : 0;
  const rise = enter === "rise" ? (1 - prog(t, at, 0.4)) * 40 : 0;
  const kb = 1 + 0.025 * Math.min(2, t - at);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + rise,
        width: w,
        height: h,
        borderRadius: radius,
        overflow: "hidden",
        border: "2px solid rgba(255,255,255,0.55)",
        boxShadow: glow ? "0 0 30px rgba(255,255,255,0.18)" : "none",
        opacity: enter === "focus" ? Math.min(1, (t - at) / 0.2) : op,
        background: "#111",
        filter: focusBlur > 0.3 ? `blur(${focusBlur}px)` : undefined,
      }}
    >
      <div style={{ position: "absolute", inset: 0, transform: `scale(${kb})` }}>
        <Media src={src} at={at} />
      </div>
    </div>
  );
};

/* ---------- serif side note ("Amazing at building authority") ---------- */
export const SerifNote: React.FC<{ text: string; at: number; x: number; y: number; size?: number; color?: string }> = ({ text, at, x, y, size = 40, color = "#EDEDED" }) => {
  const { t } = useTime();
  const chars = typeOn(text, t, at, 45, text);
  x = Math.max(x, SAFE_X);
  const room = 1080 - SAFE_X - x;
  const widest = Math.max(...text.split("\n").map((l) => textW(l, size, true)));
  size = widest > room ? size * (room / widest) : size; // shrink to stay inside the safe zone, never clip
  return (
    <div style={{ position: "absolute", left: x, top: y, color, ...serifStyle(text), fontSize: size, lineHeight: 1.05, whiteSpace: "pre" }}>
      {Array.from(text).map((ch, i) => (
        <span key={i} style={{ opacity: chars[i] }}>
          {ch}
        </span>
      ))}
    </div>
  );
};

/* ---------- spline helpers ---------- */
export type Pt = [number, number];

/** Catmull-Rom through the points, sampled densely; returns points + cumulative length. */
export const sampleSpline = (pts: Pt[], perSeg = 40) => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    for (let k = 0; k < perSeg; k++) {
      const u = k / perSeg;
      const u2 = u * u;
      const u3 = u2 * u;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  const len = [0];
  for (let i = 1; i < out.length; i++) len.push(len[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return { pts: out, len, total: len[len.length - 1] };
};

/** Slice of the sampled path between arc fractions a..b, as an SVG "d" string. */
export const slicePath = (s: ReturnType<typeof sampleSpline>, a: number, b: number) => {
  const la = s.total * Math.max(0, a);
  const lb = s.total * Math.min(1, b);
  const keep = s.pts.filter((_, i) => s.len[i] >= la && s.len[i] <= lb);
  if (keep.length < 2) return "";
  return "M" + keep.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L");
};

export const pointAtFrac = (s: ReturnType<typeof sampleSpline>, f: number): Pt => {
  const target = s.total * Math.min(1, Math.max(0, f));
  const i = s.len.findIndex((l) => l >= target);
  return s.pts[Math.max(0, i)];
};

/** Arc-length fraction of the sample closest to a control point (to time dots). */
export const fracOfPoint = (s: ReturnType<typeof sampleSpline>, p: Pt) => {
  let best = 0;
  let bd = 1e9;
  s.pts.forEach((q, i) => {
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return s.len[best] / s.total;
};

/** Neon stroke: wide blurred glow + coloured body + hot core. */
export const NeonPath: React.FC<{ d: string; color: string; width?: number; id: string }> = ({ d, color, width = 6, id }) =>
  d ? (
    <g>
      <defs>
        <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={width * 2.2} />
        </filter>
      </defs>
      <path d={d} stroke={color} strokeWidth={width * 3.2} fill="none" strokeLinecap="round" filter={`url(#glow-${id})`} opacity={0.42} />
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke="#FFFFFF" strokeWidth={width * 0.28} fill="none" strokeLinecap="round" opacity={0.22} />
    </g>
  ) : null;
