// Proof scenes built from real material: a grid of reels with view badges, a UI screenshot
// card with a neon curve drawn over it, a hero card with serif side-notes, a chip list.
import React from "react";
import { C, sansStyle } from "../tokens";
import { EASE_IN_OUT, flicker, prog, useTime } from "../anim";
import { Chip, Logo, Media, MediaCard, NeonPath, Pt, sampleSpline, SerifNote, slicePath } from "../Parts";

/* ---------- reelgrid: 3xN vertical thumbnails, staggered power-on, green view badges ---------- */
// items: [{src | srcs[], badge, badgeAt}]  — `srcs` cycles every `cycle` s (a live, busy wall)
export const ReelGrid: React.FC<any> = ({ at, items, cols = 3, x = 140, y = 330, w = 800, gap = 22, stagger = 0.06, cycle = 0.45 }) => {
  const { t, fps } = useTime();
  const cw = (w - gap * (cols - 1)) / cols;
  const ch = cw * 1.25;
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      {items.map((it: any, i: number) => {
        const a = at + i * stagger;
        if (t < a) return null;
        const r = Math.floor(i / cols);
        const c = i % cols;
        const srcs: string[] = it.srcs ?? [it.src];
        const cur = srcs[Math.floor(Math.max(0, t - a) / cycle) % srcs.length];
        const bAt = it.badgeAt ?? a + 0.4;
        return (
          <div key={i} style={{ position: "absolute", left: c * (cw + gap), top: r * (ch + gap + 46), width: cw }}>
            <div style={{ width: cw, height: ch, overflow: "hidden", borderRadius: 6, opacity: flicker(t, a, fps, `rg${i}`), boxShadow: "0 8px 22px rgba(0,0,0,0.35)" }}>
              <Media src={cur} at={a} />
            </div>
            {it.badge && t >= bAt ? (
              <div
                style={{
                  margin: "10px auto 0",
                  width: "fit-content",
                  padding: "4px 14px",
                  borderRadius: 8,
                  background: C.badgeGreen,
                  color: "#fff",
                  ...sansStyle(800),
                  fontSize: 24,
                  opacity: flicker(t, bAt, fps, `b${i}`),
                  boxShadow: "0 0 14px rgba(22,178,58,0.6)",
                }}
              >
                ◉ {it.badge}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

/* ---------- uicard: screenshot in a white rounded panel + optional neon curve over a region ---------- */
// curve: {points:[[x,y] 0..1 inside rect], rect:{x,y,w,h} in card px, at, dur, color}
export const UICard: React.FC<any> = ({ at, src, x = 300, y = 300, w = 480, h = 830, curve }) => {
  const { t, fps } = useTime();
  const grow = prog(t, at, 0.5);
  const s = curve ? sampleSpline(curve.points.map(([px, py]: Pt) => [curve.rect.x + px * curve.rect.w, curve.rect.y + (1 - py) * curve.rect.h] as Pt)) : null;
  const dp = curve ? prog(t, curve.at, curve.dur ?? 1, EASE_IN_OUT) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 22,
        border: "4px solid rgba(160,160,160,0.9)",
        background: "#fff",
        overflow: "hidden",
        opacity: flicker(t, at, fps, "ui"),
        transform: `scale(${0.92 + 0.08 * grow})`,
        boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
      }}
    >
      {src ? <Media src={src} at={at} /> : null}
      {s ? (
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <NeonPath id="ui" d={slicePath(s, 0, dp)} color={curve.color ?? C.magenta} width={5} />
        </svg>
      ) : null}
    </div>
  );
};

/* ---------- showcase: one hero card (image/video) + serif notes typed beside it ---------- */
// cards: [{src, at}] swap in place (each later card powers on over the previous one)
export const Showcase: React.FC<any> = ({ cards, notes = [], x = 250, y = 300, w = 420, h = 740 }) => {
  const { t } = useTime();
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {cards.map((c: any, i: number) =>
        t >= c.at ? <MediaCard key={i} src={c.src} at={c.at} x={c.x ?? x} y={c.y ?? y} w={c.w ?? w} h={c.h ?? h} radius={20} enter={i === 0 ? "rise" : "flicker"} /> : null
      )}
      {notes.map((n: any, i: number) => (t >= n.at ? <SerifNote key={i} text={n.text} at={n.at} x={n.x ?? x + w + 40} y={n.y ?? y + 120 + i * 120} size={n.size ?? 44} /> : null))}
    </div>
  );
};

/* ---------- list: a vertical stack of chips, each appears on its word ---------- */
export const ChipList: React.FC<any> = ({ items, x = 540, y = 520, step = 92, size = 34, state = "normal" }) => {
  const { t } = useTime();
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {items.map((it: any, i: number) => (t >= it.at ? <Chip key={i} text={it.text} at={it.at} x={it.x ?? x} y={y + i * step} size={size} state={it.state ?? state} greenAt={it.greenAt} logo={it.logo} /> : null))}
    </div>
  );
};

/* ---------- side chips sliding out of a card with a yellow end-cap ("Every Niche ▌") ---------- */
export const SideTags: React.FC<any> = ({ items }) => {
  const { t, fps } = useTime();
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {items.map((it: any, i: number) => {
        if (t < it.at) return null;
        const g = prog(t, it.at, 0.35);
        const left = it.side === "right";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: it.y,
              [left ? "left" : "right"]: left ? it.x : 1080 - it.x,
              width: 240 * g,
              height: 46,
              overflow: "hidden",
              background: "#1a1a1a",
              border: "2px solid #555",
              borderRadius: 6,
              opacity: flicker(t, it.at, fps, it.text),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              ...sansStyle(700),
              fontSize: 22,
              whiteSpace: "nowrap",
              boxShadow: left ? `inset 6px 0 0 ${C.red}` : `inset -10px 0 0 ${C.yellow}`,
            }}
          >
            {it.text}
          </div>
        );
      })}
    </div>
  );
};

/* ---------- logos: a row of big brand logos on glass tiles (each fades up on its own word) ---------- */
// items: [{key, at, label?, state?: "normal"|"green"|"dim"}]
export const Logos: React.FC<any> = ({ items, y = 560, size = 190, gap = 50, theme }) => {
  const { t, fps } = useTime();
  const n = items.length;
  // shrink the row until it fits the phone safe zone
  const fit = Math.min(1, 800 / (n * size + (n - 1) * gap));
  size = size * fit;
  gap = gap * fit;
  const total = n * size + (n - 1) * gap;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {items.map((it: any, i: number) => {
        if (t < it.at) return null;
        const op = Math.min(1, (t - it.at) / (5 / fps));
        const green = it.greenAt !== undefined && t >= it.greenAt;
        const dim = it.state === "dim" || (it.dimAt !== undefined && t >= it.dimAt);
        return (
          <div key={i} style={{ position: "absolute", left: 540 - total / 2 + i * (size + gap), top: y - size / 2, width: size, opacity: op * (dim ? 0.3 : 1), textAlign: "center" }}>
            <div
              style={{
                width: size,
                height: size,
                borderRadius: size * 0.22,
                background: theme === "light" ? "#FFFFFF" : "rgba(255,255,255,0.06)",
                border: `3px solid ${green ? "#3CDC50" : theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.18)"}`,
                boxShadow: green ? "0 0 40px rgba(40,200,70,0.55)" : theme === "light" ? "0 14px 40px rgba(0,0,0,0.15)" : "0 0 30px rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${0.94 + 0.06 * Math.min(1, (t - it.at) / 0.3)})`,
              }}
            >
              <Logo k={it.key} h={size * 0.58} theme={theme} />
            </div>
            {it.label ? <div style={{ marginTop: 16, color: theme === "light" ? "#111" : "#fff", ...sansStyle(750), fontSize: size * 0.17 }}>{it.label}</div> : null}
          </div>
        );
      })}
    </div>
  );
};
