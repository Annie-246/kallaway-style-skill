// The speaker in two framings cut from ONE source:
//  - full: fills the frame, face at ~1/3 height, punch-in levels alternate on jump cuts,
//          plus a slow 3% push so the shot is never static.
//  - card: wide framing inside a rounded card glued to the bottom edge; with a person matte
//          the head/hands break out over the card's top edge (the "pop-out").
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { H, L, W } from "./tokens";
import { useTime } from "./anim";

export type SourceCfg = {
  video: string; // path inside public/, e.g. "source/cut.mp4"
  matte?: string; // transparent webm of the person only (scripts/make_matte.py)
  w: number;
  h: number;
  face: { x: number; y: number }; // face centre in source pixels (eyes level)
  cardZoom?: number; // 1 = source width fits the card width
  cardEyeY?: number; // eye line, px below the card top (default 110 = forehead crosses the edge)
  // Close-up phone footage: shrink the person (cardZoom < 0.87) and give the card a backdrop
  // (CSS colour/gradient matching the real wall). Only the matted person is drawn on it.
  cardBg?: string;
};

type Props = { src: SourceCfg; segStart: number; segEnd: number };

// No <Sequence> around the speaker: composition time == cut-source time, so the video
// stays frame-locked to words.json without any trim arithmetic.
const vid = (path: string, transparent = false) => (
  <OffthreadVideo src={staticFile(path)} muted transparent={transparent} style={{ width: "100%", height: "100%" }} />
);

export const SpeakerFull: React.FC<Props & { zoom?: number }> = ({ src, segStart, segEnd, zoom = 1 }) => {
  const { t } = useTime();
  const base = Math.max(W / src.w, H / src.h);
  const push = 1 + 0.03 * Math.min(1, Math.max(0, (t - segStart) / Math.max(1, segEnd - segStart)));
  const s = base * zoom * push;
  const vw = src.w * s;
  const vh = src.h * s;
  // put the face at x=centre, y=34% of frame, then clamp so no edge is ever exposed
  let left = W / 2 - src.face.x * s;
  let top = H * 0.34 - src.face.y * s;
  left = Math.min(0, Math.max(W - vw, left));
  top = Math.min(0, Math.max(H - vh, top));
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      <div style={{ position: "absolute", left, top, width: vw, height: vh }}>{vid(src.video)}</div>
    </AbsoluteFill>
  );
};

export const SpeakerCard: React.FC<Props & { theme: "dark" | "light" }> = ({ src, theme }) => {
  const { x, y, w, r } = L.card;
  const s = (w / src.w) * (src.cardZoom ?? 1);
  const vw = src.w * s;
  const vh = src.h * s;
  // eyes ~110px below the card top: the cap/forehead crosses the edge, which is what sells the pop-out
  const left = x + w / 2 - src.face.x * s;
  const top = y + (src.cardEyeY ?? 110) - src.face.y * s;
  const backdrop = src.cardBg && src.matte;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: H - y + 2,
          borderRadius: `${r}px ${r}px 0 0`,
          overflow: "hidden",
          boxShadow: theme === "light" ? "0 18px 60px rgba(0,0,0,0.28)" : "0 0 0 1px rgba(255,255,255,0.06)",
          background: backdrop ? src.cardBg : "#000",
        }}
      >
        {backdrop ? null : <div style={{ position: "absolute", left: left - x, top: top - y, width: vw, height: vh }}>{vid(src.video)}</div>}
      </div>
      {src.matte ? (
        <div style={{ position: "absolute", left, top, width: vw, height: vh }}>{vid(src.matte, true)}</div>
      ) : null}
    </AbsoluteFill>
  );
};
