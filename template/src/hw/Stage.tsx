// The graphic stage (top 1180px of a split layout). Holds a list of scenes; each scene
// lives in its own camera world. Scene changes are either a hard cut (new scene powers on
// with flicker) or a "push": old world slides out left, new world slides in from the right
// with horizontal motion blur, ~0.45 s, in-out easing.
import React from "react";
import { AbsoluteFill } from "remotion";
import { L } from "./tokens";
import { camAt, CamKey, drift, EASE_IN_OUT, prog, useTime } from "./anim";
import { RichText } from "./RichText";
import { SCENES } from "./scenes";

export type SceneSpec = {
  type: string;
  at: number;
  transition?: "cut" | "push" | "morph";
  morphDur?: number;
  morphOrigin?: string; // CSS transform-origin of the morph, e.g. "540px 620px" (the shared object's centre)
  title?: { text: string; at?: number; size?: number; y?: number; fixed?: boolean };
  camera?: CamKey[];
  drift?: number;
  [k: string]: any;
};

export const XBLUR_LEVELS = [4, 10, 18, 30];
export const BlurDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    {XBLUR_LEVELS.map((s) => (
      <filter key={s} id={`hwbx${s}`} x="-20%" y="-5%" width="140%" height="110%">
        <feGaussianBlur stdDeviation={`${s} 0`} />
      </filter>
    ))}
  </svg>
);
export const xblur = (v: number) => {
  if (v < 2) return undefined;
  const lvl = XBLUR_LEVELS.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
  return `url(#hwbx${lvl})`;
};

const World: React.FC<{ spec: SceneSpec; theme: "dark" | "light"; segEnd: number }> = ({ spec, theme, segEnd }) => {
  const { t } = useTime();
  const Comp = SCENES[spec.type];
  const cam = camAt(spec.camera, t);
  const d = drift(t, spec.at, spec.drift ?? 0.035);
  const s = cam.scale * d;
  // when a badge flies up to become the header, the old title blurs out upward (Kallaway 4, 18.2 s)
  const out = spec.fly ? prog(t, spec.fly.at, 0.35) : 0;
  const title = spec.title ? (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: (spec.title.y ?? L.titleTop) - 60 * out,
        opacity: 1 - out,
        filter: out > 0.02 ? `blur(${10 * out}px)` : undefined,
      }}
    >
      <RichText text={spec.title.text} at={spec.title.at ?? spec.at} theme={theme} size={spec.title.size ?? 70} mode={spec.title.mode} wordTimes={spec.title.wordTimes} />
    </div>
  ) : null;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          transformOrigin: "0 0",
          transform: `translate(${540 - cam.x * s}px, ${590 - cam.y * s}px) scale(${s})`,
          filter: xblur(cam.vel * 0.6),
        }}
      >
        {!spec.title?.fixed && title}
        {Comp ? <Comp {...spec} theme={theme} segEnd={segEnd} /> : null}
        {(spec.layers ?? []).map((l: any, i: number) => {
          const LC = SCENES[l.type];
          return LC ? <LC key={i} at={spec.at} {...l} theme={theme} segEnd={segEnd} /> : null;
        })}
      </AbsoluteFill>
      {spec.title?.fixed && title}
    </AbsoluteFill>
  );
};

export const Stage: React.FC<{ scenes: SceneSpec[]; theme: "dark" | "light"; segEnd: number }> = ({ scenes, theme, segEnd }) => {
  const { t } = useTime();
  const idx = scenes.reduce((acc, sc, i) => (t >= sc.at ? i : acc), 0);
  const cur = scenes[idx];
  const prev = scenes[idx - 1];
  const PUSH = 0.45;
  // MORPH (Kallaway 4, 16.6 s / 52.6 s / 23.2 s): the old world does not leave the frame, it
  // dissolves INTO the new one. Old: scale 1 -> 0.86, blur 0 -> 14, fade. New: scale 1.12 -> 1,
  // blur 14 -> 0, fade in. Both share the centre, so shapes appear to turn into each other.
  const MORPH = cur.morphDur ?? 0.42;
  if (prev && cur.transition === "morph" && t < cur.at + MORPH) {
    const p = prog(t, cur.at, MORPH, EASE_IN_OUT);
    const oc = cur.morphOrigin ?? "540px 620px";
    return (
      <AbsoluteFill style={{ height: 1400, overflow: "hidden" }}>
        <AbsoluteFill style={{ opacity: 1 - p, transform: `scale(${1 - 0.14 * p})`, transformOrigin: oc, filter: `blur(${14 * p}px)` }}>
          <World spec={prev} theme={theme} segEnd={segEnd} />
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: p, transform: `scale(${1.12 - 0.12 * p})`, transformOrigin: oc, filter: p < 0.98 ? `blur(${14 * (1 - p)}px)` : undefined }}>
          <World spec={cur} theme={theme} segEnd={segEnd} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  if (prev && cur.transition === "push" && t < cur.at + PUSH) {
    const p = prog(t, cur.at, PUSH, EASE_IN_OUT);
    const v = Math.sin(p * Math.PI) * 30; // blur peaks mid-move
    return (
      <AbsoluteFill style={{ height: 1400, overflow: "hidden" }}>
        <AbsoluteFill style={{ transform: `translateX(${-1080 * p}px)`, filter: xblur(v) }}>
          <World spec={prev} theme={theme} segEnd={segEnd} />
        </AbsoluteFill>
        <AbsoluteFill style={{ transform: `translateX(${1080 * (1 - p)}px)`, filter: xblur(v) }}>
          <World spec={cur} theme={theme} segEnd={segEnd} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ height: 1400, overflow: "hidden" }}>
      <World spec={cur} theme={theme} segEnd={segEnd} />
    </AbsoluteFill>
  );
};
