// Object scenes: 3D card cluster, the colour-coded script document, and the CTA doc grid.
import React from "react";
import { C, sansStyle, serifStyle } from "../tokens";
import { EASE_IN_OUT, flicker, prog, useTime } from "../anim";
import { Media } from "../Parts";

/* ---------- cards3d: a slowly orbiting cluster of tilted vertical cards ("our cracked-out brains") ---------- */
export const Cards3D: React.FC<any> = ({ items, at, cx = 540, cy = 620, radius = 210, speed = 0.55 }) => {
  const { t, fps } = useTime();
  const n = items.length;
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1600 }}>
      <div style={{ position: "absolute", left: cx, top: cy, transformStyle: "preserve-3d", transform: "rotateX(14deg) rotateZ(-7deg)" }}>
        {items
          .map((src: string, i: number) => {
            const a = (i / n) * Math.PI * 2 + (t - at) * speed;
            const z = Math.sin(a) * radius;
            return { src, i, x: Math.cos(a) * radius * 0.95, y: Math.sin(a * 2) * 40, z };
          })
          .sort((p: any, q: any) => p.z - q.z)
          .map(({ src, i, x, y, z }: any) => {
            const appear = at + i * 0.05;
            if (t < appear) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 230,
                  height: 380,
                  left: -115,
                  top: -190,
                  transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${-22 + Math.cos(i) * 8}deg)`,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.7)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                  opacity: flicker(t, appear, fps, src + i),
                  filter: `brightness(${0.75 + 0.25 * ((z + radius) / (2 * radius))})`,
                }}
              >
                <Media src={src} at={at} />
              </div>
            );
          })}
      </div>
    </div>
  );
};

/* ---------- doc: the colour-coded "Video Script" page ---------- */
// sections: [{label, color, lines, at}]  — bars draw left→right one row per frame.
// mode "build": all sections pour in quickly at `at` (overview);
// mode "fill": the page starts as grey placeholder lines and each section recolours at its own `at`.
const SCOL: Record<string, string> = { red: C.scriptRed, yellow: C.scriptYellow, purple: C.purple, cyan: C.cyan, white: C.scriptWhite, green: C.green, grey: "#5a5a5a" };

export const Doc: React.FC<any> = ({ at, sections, mode = "build", heading = "Video Script", x = 280, y = 410, w = 525, h = 640, labels = mode === "fill", glowAt, glowSection }) => {
  const { t, fps } = useTime();
  const rows: { color: string; len: number; at: number; label?: string; first: boolean; sec: number }[] = [];
  sections.forEach((s: any, si: number) => {
    for (let k = 0; k < s.lines; k++) {
      const len = 0.55 + 0.4 * Math.abs(Math.sin(si * 7.3 + k * 3.1));
      const rowAt = mode === "build" ? at + 0.1 + rows.length * 0.035 : s.at + k * 0.05;
      rows.push({ color: SCOL[s.color] ?? s.color, len, at: rowAt, label: k === 0 ? s.label : undefined, first: k === 0, sec: si });
    }
  });
  const rowH = (h - 120) / Math.max(rows.length, 22);
  const frameOp = flicker(t, at, fps, "doc");
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        border: "3px solid rgba(255,255,255,0.92)",
        borderRadius: 12,
        boxShadow: "0 0 40px rgba(255,255,255,0.22), inset 0 0 30px rgba(255,255,255,0.05)",
        background: "rgba(0,0,0,0.6)",
        opacity: frameOp,
      }}
    >
      <div style={{ position: "absolute", top: 18, left: 0, right: 0, textAlign: "center", color: "#EDEDED", ...serifStyle(heading), fontSize: 40 }}>{heading}</div>
      {rows.map((r, i) => {
        const top = 90 + i * rowH;
        const g = prog(t, r.at, 0.18);
        const placeholder = mode === "fill" && t < r.at;
        const glow = glowAt !== undefined && glowSection === r.sec ? Math.sin(Math.min(1, Math.max(0, (t - glowAt) / 0.9)) * Math.PI) : 0;
        return (
          <React.Fragment key={i}>
            {r.first ? (
              <div
                style={{
                  position: "absolute",
                  left: 28,
                  top: top - 2,
                  width: 26,
                  height: 26,
                  background: placeholder ? "#3a3a3a" : r.color,
                  opacity: placeholder ? 1 : g,
                }}
              />
            ) : null}
            {labels && r.label && !placeholder ? (
              <div style={{ position: "absolute", left: 70, top: top - 20, color: "#fff", ...sansStyle(700), fontSize: 15, opacity: flicker(t, r.at, fps, r.label) }}>{r.label}</div>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: 70,
                top: top + (labels ? 4 : 0),
                height: Math.max(5, rowH * 0.42),
                width: (w - 110) * r.len * (placeholder ? 1 : g),
                background: placeholder ? "#4a4a4a" : r.color,
                boxShadow: glow > 0 ? `0 0 ${30 * glow}px ${r.color}` : "none",
                filter: glow > 0 ? `brightness(${1 + glow})` : undefined,
              }}
            />
          </React.Fragment>
        );
      })}
      {/* dashed spine connecting the section squares */}
      <div style={{ position: "absolute", left: 40, top: 100, bottom: 40, borderLeft: "2px dashed rgba(255,255,255,0.35)", opacity: prog(t, at, 0.6, EASE_IN_OUT) }} />
    </div>
  );
};

/* ---------- docgrid: the CTA — pages pop in one by one under "Comment “X” / To Get The Doc" ---------- */
const Page: React.FC<{ seed: number; src?: string }> = ({ seed, src }) => (
  <div style={{ width: "100%", height: "100%", background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,0.25)", overflow: "hidden", position: "relative" }}>
    {src ? (
      <Media src={src} at={0} />
    ) : (
      <div style={{ position: "absolute", inset: "12% 10%" }}>
        <div style={{ height: 6, width: "62%", background: "#222", margin: "0 auto 10px" }} />
        {Array.from({ length: 14 }).map((_, k) => (
          <div
            key={k}
            style={{
              height: 3,
              marginBottom: 6,
              width: `${55 + 40 * Math.abs(Math.sin(seed * 3.7 + k * 1.9))}%`,
              background: k === 9 && seed % 3 === 0 ? "#E6F04A" : "#9a9a9a",
            }}
          />
        ))}
      </div>
    )}
  </div>
);

export const DocGrid: React.FC<any> = ({ at, count = 8, cols = 3, pages = [], x = 150, y = 330, w = 780, gap = 26, stagger = 0.085 }) => {
  const { t, fps } = useTime();
  const cw = (w - gap * (cols - 1)) / cols;
  const ch = cw * 0.9;
  const rowsN = Math.ceil(count / cols);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: rowsN * (ch + gap) }}>
      {Array.from({ length: count }).map((_, i) => {
        const pa = at + 0.15 + i * stagger;
        if (t < pa) return null;
        const r = Math.floor(i / cols);
        const c = i % cols;
        // last row is centred when it is not full (Kallaway's 3-3-2 / 4-4-4-2 grids)
        const inRow = Math.min(cols, count - r * cols);
        const rowOff = ((cols - inRow) * (cw + gap)) / 2;
        return (
          <div key={i} style={{ position: "absolute", left: rowOff + c * (cw + gap), top: r * (ch + gap), width: cw, height: ch, opacity: flicker(t, pa, fps, `p${i}`) }}>
            <Page seed={i + 1} src={pages[i]} />
          </div>
        );
      })}
    </div>
  );
};
