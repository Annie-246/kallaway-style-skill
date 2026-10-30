// Neon line chart (story arcs, retention curves, growth lines). Everything draws on in sync
// with the voice: axes → curve with a hot head → dots pop as the head passes → labels a few
// frames BEFORE the word is said → trace / fill / bars to re-explain the same curve.
import React, { useMemo } from "react";
import { interpolate } from "remotion";
import { C, sansStyle, serifStyle } from "../tokens";
import { clamp, EASE_IN_OUT, flicker, prog, useTime } from "../anim";
import { Chip, fracOfPoint, NeonPath, PointLabel, pointAtFrac, Pt, sampleSpline, slicePath } from "../Parts";

const X0 = 150, X1 = 930, Y0 = 400, Y1 = 980;
const toPx = (p: Pt): Pt => [X0 + p[0] * (X1 - X0), Y1 - p[1] * (Y1 - Y0)];
const COL: Record<string, string> = { red: C.redLine, magenta: C.magenta, white: "#F2F2F2", yellow: C.yellow, green: C.green };

type Curve = { points: Pt[]; color?: string; at: number; dur?: number; badge?: { from: number; to: number } };

export const Chart: React.FC<any> = (p) => {
  const { t, fps } = useTime();
  const curve: Curve = p.curve;
  const main = useMemo(() => sampleSpline(curve.points.map(toPx)), [curve.points]);
  const extras = useMemo(() => (p.extra ?? []).map((e: Curve) => ({ e, s: sampleSpline(e.points.map(toPx)) })), [p.extra]);
  const axesAt = p.axes?.at ?? p.at;
  const ax = prog(t, axesAt, 0.4, EASE_IN_OUT);
  const draw = prog(t, curve.at, curve.dur ?? 1.2, EASE_IN_OUT);
  const col = COL[curve.color ?? "red"];
  const head = pointAtFrac(main, draw);

  // trace: recolour a stretch of the main curve progressively (white arc → magenta "you are here")
  const tr = p.trace;
  const trP = tr ? prog(t, tr.at, tr.dur ?? 0.8, EASE_IN_OUT) : 0;
  const trD = tr ? slicePath(main, tr.from ?? 0, (tr.from ?? 0) + ((tr.to ?? 1) - (tr.from ?? 0)) * trP) : "";

  // fill between curve and a baseline (area "above the line" = attention kept)
  const fill = p.fill;
  const fillP = fill ? prog(t, fill.at, fill.dur ?? 0.8, EASE_IN_OUT) : 0;
  const baseY = fill ? Y1 - fill.base * (Y1 - Y0) : 0;
  const fillD = fill
    ? "M" + main.pts.map(([x, y]) => `${x.toFixed(1)},${Math.min(y, baseY).toFixed(1)}`).join("L") + `L${X1},${baseY}L${X0},${baseY}Z`
    : "";

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={1080} height={1400} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="axfade" gradientUnits="userSpaceOnUse" x1={X0} x2={X1 + 20} y1={Y1} y2={Y1}>
            <stop offset="0.75" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ayfade" gradientUnits="userSpaceOnUse" x1={X0} x2={X0} y1={Y1} y2={Y0 - 40}>
            <stop offset="0.8" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id="axglow">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <clipPath id="fillclip">
            <rect x={X0} y={0} width={(X1 - X0) * fillP} height={1400} />
          </clipPath>
        </defs>
        {/* axes: L-shape grows out of the origin */}
        <g opacity={flicker(t, axesAt, fps, "ax")}>
          <line x1={X0} y1={Y1} x2={X0} y2={Y1 - (Y1 - Y0 + 40) * ax} stroke="url(#ayfade)" strokeWidth={4} filter="url(#axglow)" opacity={0.7} />
          <line x1={X0} y1={Y1} x2={X0} y2={Y1 - (Y1 - Y0 + 40) * ax} stroke="url(#ayfade)" strokeWidth={3.5} />
          <line x1={X0} y1={Y1} x2={X0 + (X1 - X0 + 20) * ax} y2={Y1} stroke="url(#axfade)" strokeWidth={4} filter="url(#axglow)" opacity={0.7} />
          <line x1={X0} y1={Y1} x2={X0 + (X1 - X0 + 20) * ax} y2={Y1} stroke="url(#axfade)" strokeWidth={3.5} />
        </g>
        {fill && fillP > 0 ? <path d={fillD} fill={C.magentaFill} opacity={0.95} clipPath="url(#fillclip)" /> : null}
        {extras.map(({ e, s }: any, k: number) => {
          const dp = prog(t, e.at, e.dur ?? 1, EASE_IN_OUT);
          return <NeonPath key={k} id={`ex${k}`} d={slicePath(s, 0, dp)} color={COL[e.color ?? "magenta"]} width={5} />;
        })}
        <NeonPath id="main" d={slicePath(main, 0, draw)} color={col} width={curve.color === "white" ? 3 : 5} />
        {trD ? <NeonPath id="trace" d={trD} color={COL[tr.color ?? "magenta"]} width={6} /> : null}
        {/* hot head while drawing */}
        {draw > 0 && draw < 1 ? <circle cx={head[0]} cy={head[1]} r={7} fill="#fff" opacity={0.9} /> : null}
      </svg>

      {/* dots appear as the head passes each control point */}
      {p.dots !== false &&
        curve.points.map((cp: Pt, i: number) => {
          const px = toPx(cp);
          const f = fracOfPoint(main, px);
          const dotAt = curve.at + (curve.dur ?? 1.2) * f;
          if (t < dotAt) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: px[0] - 11,
                top: px[1] - 11,
                width: 22,
                height: 22,
                borderRadius: 11,
                background: "#fff",
                boxShadow: "0 0 18px rgba(255,255,255,0.9)",
                opacity: flicker(t, dotAt, fps, `d${i}`),
              }}
            />
          );
        })}

      {/* axis captions, small and grey */}
      {p.axisLabels ? (
        <>
          <div style={{ position: "absolute", left: X0, right: 1080 - X1, top: Y1 + 14, textAlign: "center", color: "#9a9a9a", ...sansStyle(600), fontSize: 18, opacity: ax }}>
            {p.axisLabels.x}
          </div>
          <div style={{ position: "absolute", left: X0 - 44, top: (Y0 + Y1) / 2, transform: "rotate(-90deg)", transformOrigin: "left top", color: "#9a9a9a", ...sansStyle(600), fontSize: 18, opacity: ax }}>
            {p.axisLabels.y}
          </div>
        </>
      ) : null}

      {(p.labels ?? []).map((l: any, k: number) => {
        const px = toPx(curve.points[l.i]);
        return <PointLabel key={k} text={l.text} at={l.at} x={px[0]} y={px[1]} side={l.side} />;
      })}

      {p.valueTag ? (
        <div
          style={{
            position: "absolute",
            left: toPx(curve.points[p.valueTag.i])[0] - 70,
            top: toPx(curve.points[p.valueTag.i])[1] - 16,
            color: "#CFCFCF",
            ...serifStyle(p.valueTag.text),
            fontSize: 28,
            opacity: flicker(t, p.valueTag.at, fps, "vt"),
          }}
        >
          {p.valueTag.text}
        </div>
      ) : null}

      {/* view-counter badge riding the head of an extra curve (retention drop: 1445 → 100) */}
      {extras.map(({ e, s }: any, k: number) => {
        if (!e.badge || t < e.at) return null;
        const dp = prog(t, e.at, e.dur ?? 1, EASE_IN_OUT);
        const hp = pointAtFrac(s, dp);
        const n = Math.round(interpolate(dp, [0, 1], [e.badge.from, e.badge.to], clamp));
        return (
          <div key={`b${k}`} style={{ position: "absolute", left: hp[0] + 12, top: hp[1] - 18, background: C.redBox, color: "#fff", borderRadius: 7, padding: "4px 12px", ...sansStyle(700), fontSize: 22 }}>
            ◉ {n.toLocaleString("en-US")}
          </div>
        );
      })}

      {/* segmented progress bar under the x-axis (yellow = peak, grey = release) */}
      {p.bar
        ? (() => {
            let acc = 0;
            return p.bar.segments.map((sg: any, k: number) => {
              const x = X0 + acc * (X1 - X0);
              acc += sg.w;
              const at = sg.at ?? p.bar.at + k * 0.08;
              const g = prog(t, at, 0.25);
              if (g <= 0) return null;
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: x + 3,
                    top: Y1 + 16,
                    width: (sg.w * (X1 - X0) - 6) * g,
                    height: 18,
                    background: sg.color === "grey" ? C.grey : C.yellow,
                    borderRadius: 3,
                    boxShadow: sg.color === "grey" ? "none" : "0 0 16px rgba(250,238,6,0.55)",
                  }}
                />
              );
            });
          })()
        : null}

      {/* hook bracket + hand-lettered serif label with a little arrow */}
      {p.bracket && t >= p.bracket.at ? (
        <>
          <div
            style={{
              position: "absolute",
              left: X0 + p.bracket.x0 * (X1 - X0),
              top: Y1 + 16,
              width: (p.bracket.x1 - p.bracket.x0) * (X1 - X0) * prog(t, p.bracket.at, 0.3),
              height: 18,
              background: C.yellow,
              boxShadow: "0 0 16px rgba(250,238,6,0.55)",
            }}
          />
          <div style={{ position: "absolute", left: X0 + p.bracket.x0 * (X1 - X0) - 20, top: Y1 + 60, color: "#E8E8E8", ...serifStyle(p.bracket.label), fontSize: 38, opacity: flicker(t, p.bracket.at + 0.25, fps, "bk") }}>
            {p.bracket.label} ↩
          </div>
        </>
      ) : null}

      {/* stacked chips hanging off an elbow connector ("Contrast Moment / Contrarian Take / …") */}
      {p.chips
        ? (() => {
            const c = p.chips;
            const from = toPx(curve.points[c.from ?? 0]);
            const lineP = prog(t, c.items[0].at - 0.2, 0.3);
            return (
              <>
                <svg width={1080} height={1400} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                  <polyline
                    points={`${from[0]},${from[1]} ${from[0]},${c.y - 90} ${c.x},${c.y - 90} ${c.x},${c.y - 30}`}
                    fill="none"
                    stroke="#EDEDED"
                    strokeWidth={3}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - lineP}
                  />
                </svg>
                {c.items.map((it: any, k: number) =>
                  t >= it.at ? <Chip key={k} text={it.text} at={it.at} x={c.x} y={c.y + k * 62} size={26} state={c.state ?? "grey"} /> : null
                )}
              </>
            );
          })()
        : null}
    </div>
  );
};
