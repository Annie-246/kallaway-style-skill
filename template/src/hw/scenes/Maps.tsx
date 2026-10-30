// Map scenes: a horizontal year timeline that whips between years, and a category tree whose
// chips sit on a bus line with a red "you are here" dot. Both scroll with in-out easing and a
// horizontal motion blur proportional to speed.
import React from "react";
import { C, sansStyle } from "../tokens";
import { EASE_IN_OUT, flicker, prog, useTime } from "../anim";
import { Chip, MediaCard } from "../Parts";
import { xblur } from "../Stage";

type Focus = { at: number; index: number; dur?: number; zoom?: number };

const focusAt = (keys: Focus[], t: number) => {
  let pos = keys[0]?.index ?? 0;
  let zoom = keys[0]?.zoom ?? 1;
  let vel = 0;
  for (const k of keys) {
    if (t <= k.at) break;
    const d = k.dur ?? 0.55;
    const p = prog(t, k.at, d, EASE_IN_OUT);
    const p2 = prog(t - 1 / 30, k.at, d, EASE_IN_OUT);
    vel = Math.max(vel, Math.abs(k.index - pos) * (p - p2));
    pos = pos + (k.index - pos) * p;
    zoom = zoom + ((k.zoom ?? zoom) - zoom) * p;
  }
  return { pos, zoom, vel };
};

const Dot: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 13 }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, background: "#D0000F", border: "3px solid #fff", boxShadow: "0 0 16px rgba(255,40,40,0.6)" }} />
);

export const Timeline: React.FC<any> = ({ at, years, focus = [{ at, index: 0 }], y = 620, spacing = 300, branch }) => {
  const { t, fps } = useTime();
  const f = focusAt(focus, t);
  const offset = 540 - f.pos * spacing;
  const lineP = prog(t, at, 0.5, EASE_IN_OUT);
  const op = flicker(t, at, fps, "tl");
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${offset}px)`, filter: xblur(f.vel * 900) }}>
        <div style={{ position: "absolute", left: -2000, width: (years.length + 8) * spacing + 2000, top: y, height: 3, background: "#E8E8E8", transformOrigin: "left", transform: `scaleX(${lineP})` }} />
        {years.map((yr: string, i: number) => {
          const x = i * spacing;
          const below = branch && i === branch.index && t >= branch.at;
          return (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", left: x - 1, top: y - 60, width: 3, height: 120, background: "rgba(255,255,255,0.55)" }} />
              <div style={{ position: "absolute", left: x + spacing / 2 - 1, top: y - 30, width: 2, height: 60, background: "rgba(255,255,255,0.3)" }} />
              <Dot x={x} y={y} />
              <div style={{ position: "absolute", left: x, top: below ? y + 40 : y - 140, transform: "translateX(-50%)", color: "#fff", ...sansStyle(800), fontSize: 66 }}>{yr}</div>
            </React.Fragment>
          );
        })}
        {branch && t >= branch.at
          ? (() => {
              const x = branch.index * spacing;
              const n = branch.labels.length;
              const gap = branch.gap ?? 300;
              const cy = y - 150;
              const left = x - ((n - 1) * gap) / 2;
              const bp = prog(t, branch.at, 0.35);
              return (
                <>
                  <div style={{ position: "absolute", left: left, top: cy + 40, width: (n - 1) * gap * bp, height: 3, background: "#fff" }} />
                  <div style={{ position: "absolute", left: x - 1.5, top: cy + 40, width: 3, height: 110, background: "#fff" }} />
                  {branch.labels.map((l: any, k: number) => (
                    <React.Fragment key={k}>
                      <div style={{ position: "absolute", left: left + k * gap - 1.5, top: cy, width: 3, height: 42, background: "#fff", opacity: t >= l.at ? 1 : 0 }} />
                      {t >= l.at ? <Chip text={l.text} at={l.at} x={left + k * gap} y={cy - 10} size={24} state={l.state} greenAt={l.greenAt} logo={l.logo} /> : null}
                      {l.media && t >= (l.mediaAt ?? l.at) ? (
                        <MediaCard src={l.media} at={l.mediaAt ?? l.at} x={left + k * gap - 100} y={cy - 395} w={200} h={340} />
                      ) : null}
                    </React.Fragment>
                  ))}
                </>
              );
            })()
          : null}
      </div>
    </div>
  );
};

export const Tree: React.FC<any> = ({ at, nodes, focus = [{ at, index: 0 }], y = 1020, gap = 430, mediaW = 330, mediaH = 560, chipSize = 34 }) => {
  const { t, fps } = useTime();
  const f = focusAt(focus, t);
  const z = f.zoom;
  const offset = 540 - f.pos * gap * z;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: flicker(t, at, fps, "tree") }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "0 0",
          transform: `translate(${offset}px, ${y * (1 - z)}px) scale(${z})`,
          filter: xblur(f.vel * 900),
        }}
      >
        <div style={{ position: "absolute", left: -1600, width: nodes.length * gap + 3200, top: y + 130, height: 4, background: "#EDEDED" }} />
        {nodes.map((n: any, i: number) => {
          const x = i * gap;
          return (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", left: x - 2, top: y + 40, width: 4, height: 92, background: "#EDEDED" }} />
              <Chip text={n.text} at={n.at ?? at} x={x} y={y} w={chipSize * 9} size={chipSize} state={n.state} greenAt={n.greenAt} logo={n.logo} />
              {(n.media ?? []).map((m: any, k: number) => (
                <MediaCard key={k} src={m.src} at={m.at} x={x - mediaW / 2} y={y - 90 - mediaH} w={mediaW} h={mediaH} radius={20} />
              ))}
            </React.Fragment>
          );
        })}
        <Dot x={f.pos * gap} y={y + 132} r={15} />
      </div>
    </div>
  );
};
