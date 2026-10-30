// Full-bleed proof clip (a famous face, a viral reel) with its own stacked caption, then the
// "zoom-out into a phone" move: the clip shrinks into a phone on light paper, darkens, and a
// giant word lands on top of it.
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, sansStyle } from "./tokens";
import { EASE_IN_OUT, flicker, prog, useTime } from "./anim";
import { Media } from "./Parts";
import { Background } from "./Background";
import { RichText } from "./RichText";

export const MediaFull: React.FC<{ seg: any }> = ({ seg }) => {
  const { t } = useTime();
  const ph = seg.phone;
  const p = ph ? prog(t, ph.at, 0.5, EASE_IN_OUT) : 0;
  const push = 1.06 - 0.06 * prog(t, seg.start, seg.end - seg.start, (x) => x);
  const scale = (1 - p) * push + p * 0.6;
  const radius = 90 * p;
  const bezel = 16 * p;
  const dim = 1 - 0.6 * p;
  return (
    <AbsoluteFill>
      {p > 0 ? <Background theme="light" /> : null}
      <AbsoluteFill style={{ transform: `scale(${scale})`, filter: p > 0 && p < 1 ? `blur(${Math.sin(p * Math.PI) * 6}px)` : undefined }}>
        <AbsoluteFill
          style={{
            borderRadius: radius,
            overflow: "hidden",
            border: bezel ? `${bezel / scale}px solid #1b1b1b` : undefined,
            boxShadow: p > 0 ? "0 40px 90px rgba(0,0,0,0.35)" : undefined,
          }}
        >
          <div style={{ position: "absolute", inset: 0, filter: `brightness(${dim})` }}>
            <Media src={seg.src} at={seg.start} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {/* stacked caption that belongs to the clip (2 lines, words accumulate) */}
      {(seg.lines ?? []).map((l: any, i: number) =>
        t >= l.at && (!ph || t < ph.at) ? (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 1130 + i * 50 }}>
            <RichText text={l.text} at={l.at} theme="dark" size={44} cps={60} />
          </div>
        ) : null
      )}
      {ph && t >= ph.at + 0.15 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "left", transform: "translateY(40px)" }}>
            <div style={{ color: "#fff", ...sansStyle(700), fontSize: 30, opacity: flicker(t, ph.at + 0.15, 30, "sm") }}>{ph.small}</div>
            <div
              style={{
                color: C.white,
                ...sansStyle(900),
                fontSize: 170,
                lineHeight: 0.9,
                opacity: prog(t, ph.bigAt ?? ph.at + 0.3, 0.3),
                filter: `blur(${(1 - prog(t, ph.bigAt ?? ph.at + 0.3, 0.3)) * 14}px)`,
              }}
            >
              {ph.big}
            </div>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
