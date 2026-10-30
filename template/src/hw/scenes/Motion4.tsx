// Motion patterns learned from Kallaway sample 4 (references/analysis-v4-comprehension.md).
import React from "react";
import { Img, staticFile } from "remotion";
import { safeBox, sansStyle, serifStyle } from "../tokens";
import { EASE_IN_OUT, flicker, prog, useTime } from "../anim";
import { Logo, Media, MediaCard } from "../Parts";

/* ---------- badge: glassy icon tile that morphs its content, then flies up to become the header ----------
   content: {text} (serif numeral "1") | {logo} | {src}; morph: [{at, text|logo|src, label?}] swaps the content
   in place with a 4-frame blur cross-fade; fly: {at, dur} shrinks the tile + label into a small header at
   the top (y=150) while everything else of the scene keeps going.                                       */
const TileContent: React.FC<{ c: any; size: number; theme: any }> = ({ c, size, theme }) =>
  c.logo ? (
    <Logo k={c.logo} h={size * 0.55} theme={theme} />
  ) : c.src ? (
    <Img src={staticFile(c.src)} style={{ width: size * 0.6, height: size * 0.6, objectFit: "contain" }} />
  ) : (
    <span style={{ ...serifStyle(c.text), fontSize: size * 0.55, color: "#EDEDED" }}>{c.text}</span>
  );

export const Badge: React.FC<any> = ({ at, content, morph = [], fly, x = 540, y = 600, size = 210, label, theme }) => {
  const { t, fps } = useTime();
  if (t < at) return null;
  const states = [{ at, ...content, label }, ...morph];
  const cur = states.filter((s) => t >= s.at).pop();
  const prev = states[states.indexOf(cur) - 1];
  const mp = prev ? prog(t, cur.at, 4 / fps, (q) => q) : 1;
  const fp = fly ? prog(t, fly.at, fly.dur ?? 0.55, EASE_IN_OUT) : 0;
  const s = 1 - 0.68 * fp; // 210 px tile -> ~67 px header icon
  const cy = y + (150 - y) * fp;
  const enter = Math.min(1, (t - at) / 0.25);
  const lab = cur.label ?? label;
  return (
    <div style={{ position: "absolute", left: x, top: cy, transform: `translate(-50%, -50%) scale(${s * (0.9 + 0.1 * enter)})`, opacity: flicker(t, at, fps, "badge"), textAlign: "center" }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.16,
          margin: "0 auto",
          background: "linear-gradient(160deg, #3a3a3a 0%, #1c1c1c 55%, #141414 100%)",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.18), 0 22px 60px rgba(0,0,0,0.7), 0 0 50px rgba(255,255,255,0.10)",
          position: "relative",
        }}
      >
        {prev ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - mp, filter: `blur(${8 * mp}px)` }}>
            <TileContent c={prev} size={size} theme={theme} />
          </div>
        ) : null}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: mp, filter: mp < 1 ? `blur(${8 * (1 - mp)}px)` : undefined }}>
          <TileContent c={cur} size={size} theme={theme} />
        </div>
      </div>
      {lab ? (
        <div style={{ marginTop: size * 0.12, whiteSpace: "nowrap", color: "#fff", ...sansStyle(800), fontSize: size * 0.22, opacity: prog(t, cur.at, 0.2), textShadow: "0 0 24px rgba(255,255,255,0.35)" }}>{lab}</div>
      ) : null}
    </div>
  );
};

/* ---------- orbit: thumbnails drift on an ellipse around a central object (brain / logo / product) ----------
   Cards keep their upright angle, bob a little, and the back half is darker + smaller (fake depth).
   center: {src | logo, at, size}; items: [src]; colorAt: [{at, filter}] re-tints the centre (white->yellow->green). */
export const Orbit: React.FC<any> = ({ at, center, items, cx = 540, cy = 660, rx = 300, ry = 250, speed = 0.35, cardW = 120, colorAt = [], theme }) => {
  const { t, fps } = useTime();
  if (t < at) return null;
  const tint = colorAt.filter((c: any) => t >= c.at).pop();
  const cards = items.map((src: string, i: number) => {
    const a = (i / items.length) * Math.PI * 2 + (t - at) * speed;
    const depth = (Math.sin(a) + 1) / 2; // 0 back .. 1 front
    return { src, i, x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry * 0.55 + Math.sin(t * 1.3 + i) * 8, depth };
  });
  const card = (c: any) => {
    const appear = at + c.i * 0.06;
    if (t < appear) return null;
    const w = cardW * (0.8 + 0.3 * c.depth);
    return (
      <div key={c.i} style={{ position: "absolute", left: c.x - w / 2, top: c.y - w * 0.9, width: w, height: w * 1.78, borderRadius: 10, overflow: "hidden", border: "2px solid rgba(255,255,255,0.6)", boxShadow: "0 0 26px rgba(150,190,255,0.35)", opacity: Math.min(1, (t - appear) / 0.15) * (0.55 + 0.45 * c.depth), filter: `brightness(${0.6 + 0.4 * c.depth})` }}>
        <Media src={c.src} at={at} />
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {cards.filter((c: any) => c.depth < 0.5).map(card)}
      {t >= (center.at ?? at) ? (
        <div style={{ position: "absolute", left: cx, top: cy, transform: `translate(-50%, -50%) scale(${0.85 + 0.15 * prog(t, center.at ?? at, 0.4)})`, filter: tint?.filter, opacity: Math.min(1, (t - (center.at ?? at)) / 0.2) }}>
          {center.logo ? <Logo k={center.logo} h={center.size ?? 260} theme={theme} /> : <Img src={staticFile(center.src)} style={{ width: center.size ?? 300, height: "auto" }} />}
        </div>
      ) : null}
      {cards.filter((c: any) => c.depth >= 0.5).map(card)}
    </div>
  );
};

/* ---------- progress: a media card with a white progress bar under it that fills with the narration ----------
   clips: [{src, at}] swap in place; bar fills from barAt to barEnd (Kallaway 4, 27-39 s: "weeks, months, a year"). */
export const Progress: React.FC<any> = ({ clips, barAt, barEnd, x = 160, y = 380, w = 760, h = 430 }) => {
  const { t } = useTime();
  const sb = safeBox(x, w);
  const p = prog(t, barAt, barEnd - barAt, (q) => q);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {clips.map((c: any, i: number) => (t >= c.at && (!clips[i + 1] || t < clips[i + 1].at + 0.2) ? <MediaCard key={i} src={c.src} at={c.at} x={sb.x} y={y} w={sb.w} h={h * sb.k} enter={i === 0 ? "focus" : "cut"} /> : null))}
      {t >= barAt ? (
        <div style={{ position: "absolute", left: sb.x, top: y + h * sb.k + 34, width: sb.w, height: 34, border: "3px solid #fff", borderRadius: 4, boxShadow: "0 0 18px rgba(255,255,255,0.35)" }}>
          <div style={{ position: "absolute", left: 4, top: 4, bottom: 4, width: `calc(${p * 100}% - 8px)`, background: "#fff" }} />
        </div>
      ) : null}
    </div>
  );
};
