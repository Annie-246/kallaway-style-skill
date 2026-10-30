// Top-level composition: walks plan.segments and renders exactly one layout per frame.
//   split : graphic stage (top) + caption + speaker card with pop-out (bottom)  ~75-80% of runtime
//   full  : speaker fills the frame, caption on the chest                       pivots / punchlines
//   media : full-bleed proof clip, optional zoom-out into a phone               rare, 1 per video
// All cuts between layouts are HARD cuts; motion lives inside the graphics, not in transitions.
import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { Background } from "./hw/Background";
import { Caption } from "./hw/Caption";
import { SpeakerCard, SpeakerFull } from "./hw/Speaker";
import { BlurDefs, Stage } from "./hw/Stage";
import { MediaFull } from "./hw/MediaFull";
import { useTime } from "./hw/anim";
import { setLogos } from "./hw/Parts";
import { L } from "./hw/tokens";

const GRAPHIC_SHIFT = 140;
const GRAPHIC_SCALE = 1.15;

export type Plan = any;

const musicVolume = (plan: Plan, fps: number) => (f: number) => {
  const m = plan.music;
  const t = f / fps;
  const base = m.volume ?? 0.14;
  const ramp = 2 / fps; // drops are near-instant: the bed is CUT, not faded
  let v = base;
  for (const [a, b] of m.drops ?? []) {
    if (t >= a - ramp && t <= b + ramp) {
      v = Math.min(v, base * interpolate(t, [a - ramp, a, b, b + ramp], [1, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    }
  }
  const fadeOut = interpolate(t, [plan.duration - 0.6, plan.duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return v * fadeOut;
};

export const KallawayVideo: React.FC<{ plan: Plan }> = ({ plan }) => {
  setLogos(plan.logos);
  const { t } = useTime();
  const { fps } = useVideoConfig();
  const seg = plan.segments.find((s: any) => t >= s.start && t < s.end) ?? plan.segments[plan.segments.length - 1];
  const theme = seg.theme ?? "dark";
  const cap = plan.captions ?? {};
  const capHide = [...(cap.hide ?? []), ...plan.segments.filter((s: any) => s.layout === "media" || s.caption === false).map((s: any) => [s.start, s.end])];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <BlurDefs />
      {seg.layout === "full" ? (
        <SpeakerFull src={plan.source} segStart={seg.start} segEnd={seg.end} zoom={seg.zoom ?? 1} />
      ) : seg.layout === "media" ? (
        <MediaFull seg={seg} />
      ) : (
        <>
          <Background theme={theme} />
          {/* card:false = voice-only stretch: no speaker card, stage moved down to sit mid-frame */}
          <AbsoluteFill style={{ transformOrigin: "50% 0", transform: seg.card === false ? `translateY(${GRAPHIC_SHIFT}px) scale(${GRAPHIC_SCALE})` : undefined }}>
            <Stage scenes={seg.scenes ?? []} theme={theme} segEnd={seg.end} />
          </AbsoluteFill>
          {seg.card === false ? null : <SpeakerCard src={plan.source} segStart={seg.start} segEnd={seg.end} theme={theme} />}
        </>
      )}
      <Caption words={plan.words} serif={cap.serif} hide={capHide} mode={seg.layout === "full" ? "full" : "split"} theme={theme} y={seg.card === false ? 1600 : seg.layout !== "full" ? cap.splitY : undefined} />

      {/* audio: voice from the cut source, music bed with hard drops, sparse SFX from the plan */}
      <Audio src={staticFile(plan.source.video)} volume={plan.voiceVolume ?? 1} />
      {plan.music?.src ? <Audio src={staticFile(plan.music.src)} loop volume={musicVolume(plan, fps)} /> : null}
      {/* two-layer bed: drums play only while graphics are on screen and re-enter on the cut */}
      {plan.music?.rest ? <Audio src={staticFile(plan.music.rest)} loop volume={musicVolume(plan, fps)} /> : null}
      {plan.music?.drums ? (
        <Audio
          src={staticFile(plan.music.drums)}
          loop
          volume={(f) => {
            const tt = f / fps;
            const s = plan.segments.find((x: any) => tt >= x.start && tt < x.end);
            const on = !plan.music.drumsOnlyInSplit || (s && s.layout !== "full");
            return on ? musicVolume(plan, fps)(f) * (plan.music.drumsGain ?? 1.4) : 0;
          }}
        />
      ) : null}
      {(plan.sfx ?? []).map((s: any, i: number) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.at * fps))} layout="none">
          <Audio src={staticFile(s.src)} volume={s.volume ?? 0.35} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
