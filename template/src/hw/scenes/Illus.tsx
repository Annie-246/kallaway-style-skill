// Illus: a neon drawing board for bespoke explainer illustrations (Kallaway sample 4: brain that
// fills with colour, bird diving into a cone, rings, dots travelling along lines).
// Everything is stroke line-art drawn on with a hot glow; no capsules, no plain cards.
//
// items (all times absolute seconds, coordinates in the 1080 x 1400 stage):
//   {k:"icon",   name, x, y, size, at, dur, color, states:[{at,color}], level:{at,dur,color,to}, pulse, exitAt}
//   {k:"path",   d, at, dur, color, width}                               free SVG path in stage px
//   {k:"line",   from:[x,y], to:[x,y], bend, at, dur, color, width, arrow, dot:{at,dur,loop}}
//   {k:"ring",   x, y, r, at, dur, color, width, fill}
//   {k:"array",  name, n, cols, x, y, size, gap, at, step, on:{count, at, step, color}}
//   {k:"counter",from, to, at, dur, x, y, size, prefix, suffix, color}
//   {k:"flow",   from:[x,y], to:[x,y], bend, at, dur, n, color}            particles streaming between objects
//   {k:"orb",    x, y, r, color, at, dur}                                 soft glow blob (focus / energy)
//   {k:"label",  text, x, y, at, size, serif, color, pill}
//   {k:"logo",   key, x, y, size, at, dimAt, greenAt, exitAt}             brand logo as a node of the drawing (L-LOGO)
import React from "react";
import { interpolate } from "remotion";
import { C, sansStyle, serifStyle } from "../tokens";
import { clamp, EASE_IN_OUT, EASE_OUT, flicker, prog, useTime } from "../anim";
import { ICONS } from "../icons";
import { Logo } from "../Parts";

const COL: Record<string, string> = { red: C.redLine, magenta: C.magenta, yellow: C.yellow, green: "#2BE05A", cyan: C.cyan, white: "#F4F4F4", orange: "#FF8A1F", grey: "#8a8a8a" };
const col = (c?: string) => (c ? COL[c] ?? c : COL.white);

const lerpColor = (a: string, b: string, p: number) => {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [x, y] = [h(a), h(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * p).toString(16).padStart(2, "0")).join("");
};

/** colour at time t from a list of {at, color} states (each change blends over 0.35 s). */
const stateColor = (base: string, states: any[] | undefined, t: number) => {
  let c = col(base);
  for (const s of states ?? []) {
    if (t < s.at) break;
    c = lerpColor(c, col(s.color), prog(t, s.at, 0.35, EASE_IN_OUT));
  }
  return c;
};

/** three-layer neon: wide blurred glow, coloured body, hot white core */
const Neon: React.FC<{ id: string; color: string; w: number; children: (sw: number) => React.ReactNode; dash?: number; glow?: boolean }> = ({ id, color, w, children, dash, glow = true }) => {
  const ds = dash === undefined ? {} : { strokeDasharray: 1, strokeDashoffset: 1 - dash };
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" style={ds}>
      <defs>
        <filter id={`ig-${id}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={w * 1.6} />
        </filter>
      </defs>
      {glow ? (
        <g stroke={color} filter={`url(#ig-${id})`} opacity={0.42}>
          {children(w * 3)}
        </g>
      ) : null}
      <g stroke={color}>{children(w)}</g>
      <g stroke="#FFFFFF" opacity={0.22}>
        {children(w * 0.32)}
      </g>
    </g>
  );
};

const curve = (a: number[], b: number[], bend = 0) => {
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend;
  const my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  return { d: `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`, at: (u: number) => [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * mx + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * my + u * u * b[1]] };
};

const Icon: React.FC<{ it: any; i: number; t: number; fps: number }> = ({ it, i, t, fps }) => {
  const body = ICONS[it.name];
  if (!body) throw new Error(`icon "${it.name}" not in assets/icons - add the SVG and run build_icons.py`);
  const size = it.size ?? 220;
  const draw = prog(t, it.at, it.dur ?? 0.7, EASE_IN_OUT);
  const c = stateColor(it.color ?? "white", it.states, t);
  const pulse = it.pulse ? 1 + 0.04 * Math.sin((t - it.at) * 5) : 1;
  const out = it.exitAt ? prog(t, it.exitAt, 0.3) : 0;
  const lv = it.level ? prog(t, it.level.at, it.level.dur ?? 0.8, EASE_IN_OUT) * (it.level.to ?? 1) : 0;
  const k = size / 24;
  // the group is scaled by k, so stroke widths and blur stay in 24-unit icon space (no double scaling)
  const g = (sw: number) => <g strokeWidth={sw} dangerouslySetInnerHTML={{ __html: body }} />;
  return (
    <g transform={`translate(${it.x - (size * pulse) / 2},${it.y - (size * pulse) / 2}) scale(${k * pulse})`} opacity={(1 - out) * flicker(t, it.at, fps, `ic${i}`)}>
      <Neon id={`ic${i}`} color={c} w={it.width ?? 1.6} dash={draw}>
        {(sw) => g(sw)}
      </Neon>
      {lv > 0 ? (
        <g>
          <defs>
            <clipPath id={`lv${i}`}>
              <rect x={-2} y={26 - 28 * lv} width={28} height={28 * lv + 2} />
            </clipPath>
          </defs>
          <g clipPath={`url(#lv${i})`}>
            <Neon id={`lvn${i}`} color={col(it.level.color ?? "red")} w={(it.width ?? 1.6) * 1.15} glow={false}>
              {(sw) => g(sw)}
            </Neon>
          </g>
        </g>
      ) : null}
    </g>
  );
};

export const Illus: React.FC<any> = ({ items = [] }) => {
  const { t, fps } = useTime();
  const svg: React.ReactNode[] = [];
  const html: React.ReactNode[] = [];
  items.forEach((it: any, i: number) => {
    if (t < it.at) return;
    const c = stateColor(it.color ?? "white", it.states, t);
    const w = it.width ?? 5;
    if (it.k === "icon") svg.push(<Icon key={i} it={it} i={i} t={t} fps={fps} />);
    else if (it.k === "path" || it.k === "line" || it.k === "ring") {
      const dp = prog(t, it.at, it.dur ?? 0.6, EASE_IN_OUT);
      const geo =
        it.k === "path" ? { d: it.d } : it.k === "ring" ? { d: `M${it.x},${it.y - it.r} a${it.r},${it.r} 0 1,1 -0.01,0` } : curve(it.from, it.to, it.bend ?? 0);
      svg.push(
        <g key={i}>
          {it.fill && dp >= 1 ? <circle cx={it.x} cy={it.y} r={it.r} fill={c} opacity={0.18 * prog(t, it.at + (it.dur ?? 0.6), 0.4)} /> : null}
          <Neon id={`p${i}`} color={c} w={w} dash={dp}>
            {(sw) => <path d={geo.d} pathLength={1} strokeWidth={sw} />}
          </Neon>
          {it.arrow && dp >= 1
            ? (() => {
                const [x1, y1] = (geo as any).at(0.97);
                const [x2, y2] = it.to;
                const a = Math.atan2(y2 - y1, x2 - x1);
                const s = w * 4;
                return (
                  <path
                    d={`M${x2 - s * Math.cos(a - 0.5)},${y2 - s * Math.sin(a - 0.5)} L${x2},${y2} L${x2 - s * Math.cos(a + 0.5)},${y2 - s * Math.sin(a + 0.5)}`}
                    stroke={c}
                    strokeWidth={w}
                    fill="none"
                    strokeLinecap="round"
                  />
                );
              })()
            : null}
          {it.dot && t >= it.dot.at
            ? (() => {
                const per = it.dot.dur ?? 0.8;
                let u = (t - it.dot.at) / per;
                u = it.dot.loop ? u % 1 : Math.min(1, u);
                const [x, y] = (geo as any).at ? (geo as any).at(EASE_IN_OUT(u)) : [0, 0];
                return <circle cx={x} cy={y} r={w * 2.2} fill="#fff" style={{ filter: `drop-shadow(0 0 ${w * 1.6}px ${c}88)` }} />;
              })()
            : null}
        </g>,
      );
    } else if (it.k === "flow") {
      const g = curve(it.from, it.to, it.bend ?? 0.15);
      const n = it.n ?? 7;
      const per = it.dur ?? 1.2;
      for (let j = 0; j < n; j++) {
        const u = ((t - it.at) / per + j / n) % 1;
        const [x, y] = g.at(u);
        const fade = Math.sin(u * Math.PI);
        svg.push(<circle key={`${i}-${j}`} cx={x} cy={y} r={(it.r ?? 7) * (0.6 + 0.4 * fade)} fill={c} opacity={fade * Math.min(1, (t - it.at) / 0.3)} style={{ filter: `drop-shadow(0 0 5px ${c}88)` }} />);
      }
    } else if (it.k === "orb") {
      const p = prog(t, it.at, it.dur ?? 0.5, EASE_OUT);
      svg.push(
        <g key={i}>
          <defs>
            <radialGradient id={`orb${i}`}>
              <stop offset="0" stopColor={c} stopOpacity={0.4} />
              <stop offset="0.55" stopColor={c} stopOpacity={0.14} />
              <stop offset="1" stopColor={c} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={it.x} cy={it.y} r={it.r * (0.7 + 0.3 * p)} fill={`url(#orb${i})`} opacity={p} />
        </g>,
      );
    } else if (it.k === "array") {
      const n = it.n ?? 10;
      const cols = it.cols ?? 5;
      const size = it.size ?? 90;
      const gap = it.gap ?? 26;
      const W = cols * size + (cols - 1) * gap;
      for (let j = 0; j < n; j++) {
        const a0 = it.at + j * (it.step ?? 0.05);
        if (t < a0) continue;
        const lit = it.on && j < it.on.count && t >= it.on.at + j * (it.on.step ?? 0.08);
        svg.push(
          <Icon
            key={`${i}-${j}`}
            i={i * 100 + j}
            t={t}
            fps={fps}
            it={{ name: it.name, at: a0, dur: 0.35, size, x: it.x - W / 2 + (j % cols) * (size + gap) + size / 2, y: it.y + Math.floor(j / cols) * (size + gap), color: lit ? it.on.color ?? "green" : it.color ?? "grey", width: 1.4 }}
          />,
        );
      }
    } else if (it.k === "counter") {
      const v = interpolate(t, [it.at, it.at + (it.dur ?? 1)], [it.from ?? 0, it.to], { ...clamp, easing: EASE_OUT });
      html.push(
        <div key={i} style={{ position: "absolute", left: it.x, top: it.y, transform: "translate(-50%,-50%)", color: c, ...sansStyle(900), fontSize: it.size ?? 150, textShadow: `0 0 22px ${c}44`, whiteSpace: "nowrap" }}>
          {it.prefix ?? ""}
          {Math.round(v).toLocaleString("en-US")}
          {it.suffix ?? ""}
        </div>,
      );
    } else if (it.k === "logo") {
      const size = it.size ?? 120;
      const enter = Math.min(1, (t - it.at) / 0.25);
      const dim = it.dimAt !== undefined && t >= it.dimAt ? 1 - 0.7 * prog(t, it.dimAt, 0.3) : 1;
      const out = it.exitAt ? 1 - prog(t, it.exitAt, 0.3) : 1;
      const green = it.greenAt !== undefined && t >= it.greenAt;
      html.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: it.x,
            top: it.y,
            transform: `translate(-50%,-50%) scale(${0.7 + 0.3 * enter})`,
            opacity: flicker(t, it.at, fps, `lg${i}`) * dim * out,
            filter: `drop-shadow(0 0 ${green ? 14 : 8}px ${green ? "rgba(43,224,90,0.5)" : "rgba(255,255,255,0.18)"})`,
          }}
        >
          <Logo k={it.key} h={size} theme="dark" />
        </div>,
      );
    } else if (it.k === "label") {
      const op = flicker(t, it.at, fps, `lb${i}`);
      html.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: it.x,
            top: it.y,
            transform: "translate(-50%,-50%)",
            opacity: op,
            whiteSpace: "nowrap",
            color: it.pill ? C.ink : col(it.color),
            background: it.pill ? "#fff" : undefined,
            padding: it.pill ? "6px 16px" : undefined,
            borderRadius: it.pill ? 8 : undefined,
            ...(it.serif ? { ...serifStyle(it.text), fontSize: it.size ?? 52 } : { ...sansStyle(800), fontSize: it.size ?? 40 }),
            textShadow: it.pill ? undefined : "0 0 14px rgba(255,255,255,0.12)",
          }}
        >
          {it.text}
        </div>,
      );
    }
  });
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={1080} height={1400} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {svg}
      </svg>
      {html}
    </div>
  );
};
