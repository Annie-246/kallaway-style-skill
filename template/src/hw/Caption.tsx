// One-word-at-a-time captions. Hard switch on every word (no pop, no bounce); short function
// words ride along with the next word; chosen key phrases flip to the italic serif with a
// 4-frame blur-in. Group building is pure so plan.json authors can predict it.
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { C, L, SAFE_W, SAFE_X, sansStyle, serifStyle, textW } from "./tokens";
import { clamp, useTime } from "./anim";

export type Word = { s: number; e: number; w: string };
type Group = { s: number; e: number; text: string; serif: boolean };

const norm = (x: string) => x.toLowerCase().replace(/[.,!?;:"“”]/g, "").trim();

export const buildGroups = (words: Word[], serifPhrases: string[] = [], maxShort = 3): Group[] => {
  const phrases = serifPhrases.map((p) => norm(p).split(/\s+/));
  const out: Group[] = [];
  let i = 0;
  while (i < words.length) {
    const ph = phrases.find((p) => p.every((pw, k) => words[i + k] && norm(words[i + k].w) === pw));
    if (ph) {
      const last = words[i + ph.length - 1];
      out.push({ s: words[i].s, e: last.e, text: words.slice(i, i + ph.length).map((w) => w.w.trim()).join(" "), serif: true });
      i += ph.length;
      continue;
    }
    // merge tiny words ("the", "you", "là", "và") forward, max 3 words / 14 chars per group
    let j = i;
    let text = words[i].w.trim();
    while (
      j + 1 < words.length &&
      norm(words[j].w).length <= maxShort &&
      j - i < 2 &&
      (text + " " + words[j + 1].w.trim()).length <= 14 &&
      words[j + 1].s - words[j].e < 0.15 &&
      !/[.?!…]$/.test(words[j].w.trim()) && // never glue across a sentence end
      words[j + 1].w.trim()[0] === words[j + 1].w.trim()[0].toLowerCase() && // capitalised = new sentence
      !/,$/.test(words[j].w.trim()) &&
      !phrases.some((p) => norm(words[j + 1].w) === p[0])
    ) {
      j++;
      text += " " + words[j].w.trim();
    }
    out.push({ s: words[i].s, e: words[j].e, text, serif: false });
    i = j + 1;
  }
  // hold each group until the next one starts (unless the pause is long)
  return out.map((g, k) => ({ ...g, e: out[k + 1] && out[k + 1].s - g.e < 0.45 ? out[k + 1].s : g.e + 0.15 }));
};

export const Caption: React.FC<{
  words: Word[];
  serif?: string[];
  hide?: [number, number][];
  mode: "split" | "full";
  theme: "dark" | "light";
  y?: number; // override caption centre (graphic-only split, no speaker card)
}> = ({ words, serif, hide, mode, theme, y: yOverride }) => {
  const { t, fps } = useTime();
  const groups = useMemo(() => buildGroups(words, serif), [words, serif]);
  if (hide?.some(([a, b]) => t >= a && t < b)) return null;
  const g = groups.find((x) => t >= x.s - 0.02 && t < x.e);
  if (!g) return null;
  const y = yOverride ?? (mode === "split" ? L.captionSplitY : L.captionFullY);
  const color = mode === "split" && theme === "light" ? C.ink : C.white;
  const blurIn = g.serif ? interpolate(t, [g.s - 0.02, g.s + 4 / fps], [1, 0], clamp) : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          right: SAFE_X,
          top: y,
          transform: "translateY(-50%)",
          textAlign: "center",
          color,
          whiteSpace: "nowrap",
          textShadow: mode === "full" ? "0 2px 14px rgba(0,0,0,0.45)" : "none",
          opacity: 1 - blurIn * 0.8,
          filter: blurIn > 0 ? `blur(${blurIn * 10}px)` : undefined,
          ...(g.serif
            ? { ...serifStyle(g.text), fontSize: Math.min(mode === "full" ? 90 : 80, SAFE_W / Math.max(1, textW(g.text, 1, true))) }
            : { ...sansStyle(760), fontSize: Math.min(mode === "full" ? 68 : 60, SAFE_W / Math.max(1, textW(g.text, 1))), letterSpacing: "-0.035em" }),
        }}
      >
        {g.text}
      </div>
    </AbsoluteFill>
  );
};
