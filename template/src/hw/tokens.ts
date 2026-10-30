// Design tokens measured from the Kallaway reference frames (1080x1920).
// See references/design-system.md for where each number comes from.
import type React from "react";
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

loadFont({ family: "HW Sans", url: staticFile("fonts/InterTight-VF.ttf"), weight: "100 900" });
loadFont({ family: "HW Serif EN", url: staticFile("fonts/InstrumentSerif-Italic.ttf"), style: "italic" });
loadFont({ family: "HW Serif VI", url: staticFile("fonts/NotoSerifDisplay-Italic-VF.ttf"), style: "italic", weight: "100 900" });

export const W = 1080;
export const H = 1920;

export const C = {
  bgDark: "#050505",
  bgLight: "#E1E1E0",
  white: "#FFFFFF",
  ink: "#0B0B0B",
  red: "#C4000A", // red words inside titles
  redBox: "#AE0001", // highlight box behind titles
  redLine: "#E0101E", // glowing chart line (traditional / "bad")
  magenta: "#D11CFF", // glowing chart line (modern / "good")
  magentaFill: "#9A00BD",
  yellow: "#FAEE06",
  grey: "#ABABA8",
  cyan: "#16F4E0",
  green: "#1FC305",
  purple: "#8C009F",
  scriptRed: "#A80000",
  scriptYellow: "#E5E50D",
  scriptWhite: "#D9D9D9",
  chipBg: "#111111",
  chipBorder: "#8B8B8B",
  chipGreen: "#147A1E",
  badgeGreen: "#16B23A",
};

// Phone safe zone: feeds crop/cover the outer edges, so nothing readable or framed may sit closer
// than SAFE_X to the left/right edge (140 px of 1080 = about 1 cm on a phone screen).
export const SAFE_X = 140;
export const SAFE_W = 1080 - 2 * SAFE_X;
/** Keep a box of width w inside the safe zone: shift first, shrink only if it is wider than SAFE_W. */
export const safeBox = (x: number, w: number) => {
  const ww = Math.min(w, SAFE_W);
  return { x: Math.min(Math.max(x, SAFE_X), 1080 - SAFE_X - ww), w: ww, k: ww / w };
};
/** Rough rendered width of a text run (Inter Tight 800 at -0.04em ~0.5 em/char, condensed serif ~0.4 em/char; measured on rendered titles). */
export const textW = (s: string, size: number, serif = false) => Array.from(s).length * size * (serif ? 0.4 : 0.5);

export const L = {
  card: { x: 100, y: 1404, w: 880, r: 44 }, // speaker card (pulled 32 px inside Kallaway's 68 for the phone safe zone)
  captionSplitY: 1243, // caption centre when the card is on screen (60 px text, ascender top y=1219)
  captionFullY: 1170, // caption centre on full-screen speaker (68 px text, chest height)
  titleTop: 150, // title block top inside the graphic stage
  stageH: 1180, // graphic stage = top 0..1180, everything above the caption
};

export const SANS = "'HW Sans', 'Inter Tight', Arial, sans-serif";

const VI_RE = /[^\x00-\x7F‘’“”–—…]/;

// Instrument Serif has no Vietnamese glyphs; Noto Serif Display at wdth 62 is the closest
// condensed italic that does. Pick per string so glyphs never mix inside one word.
export const serifStyle = (text: string): React.CSSProperties =>
  VI_RE.test(text)
    ? { fontFamily: "'HW Serif VI', serif", fontStyle: "italic", fontVariationSettings: "'wdth' 62, 'wght' 400", letterSpacing: "-0.01em" }
    : { fontFamily: "'HW Serif EN', serif", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.01em" };

export const sansStyle = (weight = 800): React.CSSProperties => ({
  fontFamily: SANS,
  fontWeight: weight,
  letterSpacing: "-0.04em",
});

export type Theme = "dark" | "light";
export const fg = (theme: Theme) => (theme === "light" ? C.ink : C.white);
