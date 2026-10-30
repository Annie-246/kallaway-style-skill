// Title typography: heavy grotesk + condensed italic serif + red accents, typed on with a
// flickering leading edge. Markup:  _serif italic_   [red words]   {red box}   <claude> = inline logo   \n = new line
import React from "react";
import { C, fg, SAFE_W, sansStyle, serifStyle, textW, Theme } from "./tokens";
import { flicker, prog, typeOn, useTime } from "./anim";
import { Logo } from "./Parts";

type Seg = { text: string; kind: "sans" | "serif" | "red" | "box" | "logo" };

const parseLine = (line: string): Seg[] => {
  const out: Seg[] = [];
  const re = /_([^_]+)_|\[([^\]]+)\]|\{([^}]+)\}|<([a-z0-9-]+)>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push({ text: line.slice(last, m.index), kind: "sans" });
    if (m[1]) out.push({ text: m[1], kind: "serif" });
    else if (m[2]) out.push({ text: m[2], kind: "red" });
    else if (m[3]) out.push({ text: m[3], kind: "box" });
    else out.push({ text: m[4], kind: "logo" });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last), kind: "sans" });
  return out;
};

export const RichText: React.FC<{
  text: string;
  at: number;
  theme: Theme;
  size?: number; // sans font size in px; serif is drawn 1.32x larger on the same baseline
  cps?: number; // characters per second of the type-on
  lineDelay?: number;
  align?: "center" | "left";
  weight?: number;
  style?: React.CSSProperties;
  // Three measured title entrances (references/precise-measurements.md §5):
  //  "type"    left->right ~100 chars/s, line 2 starts 0.17-0.32 s later and flickers in   (samples 2, 3)
  //  "flicker" the whole title powers on at once, on/off/on over ~5 frames                 (sample 1)
  //  "words"   one word per spoken word (~3 frames apart), line 2 flickers in              (sample 4)
  mode?: "type" | "flicker" | "words";
  wordTimes?: number[]; // absolute times for "words" mode; default = at + i * wordGap
  wordGap?: number;
}> = ({ text, at, theme, size = 72, cps = 100, lineDelay = 0.25, align = "center", weight = 800, style, mode = "type", wordTimes, wordGap = 0.13 }) => {
  const { t, fps } = useTime();
  let wordIdx = 0; // running word counter across lines for "words" mode
  let lines = text.split("\n");
  // a single line that is wider than the safe zone breaks at the space nearest its middle
  // (outside markup) before anything gets shrunk - Kallaway titles are 1-2 lines, never tiny
  if (lines.length === 1 && textW(text.replace(/[_\[\]{}]/g, ""), size) > SAFE_W) {
    let depth = 0;
    let best = -1;
    Array.from(text).forEach((ch, i) => {
      if ("_[{<".includes(ch) && !(ch === "_" && depth)) depth++;
      else if ("]}>".includes(ch) || (ch === "_" && depth)) depth = Math.max(0, depth - 1);
      else if (ch === " " && depth === 0 && (best < 0 || Math.abs(i - text.length / 2) < Math.abs(best - text.length / 2))) best = i;
    });
    if (best > 0) lines = [text.slice(0, best), text.slice(best + 1)];
  }
  // auto-fit: the widest line must fit the phone safe zone (titles are never clipped at the edge)
  const lineW = (ln: string) =>
    parseLine(ln).reduce((acc, s) => acc + (s.kind === "logo" ? size * 1.3 : s.kind === "serif" ? textW(s.text, size * 1.32, true) : textW(s.text, size)), 0);
  const widest = Math.max(...lines.map(lineW));
  if (widest > SAFE_W) size = size * (SAFE_W / widest);
  return (
    <div style={{ textAlign: align, lineHeight: 0.92, color: fg(theme), ...style }}>
      {lines.map((line, li) => {
        const lineAt = at + li * lineDelay;
        const segs = parseLine(line);
        const flat = segs.map((s) => (s.kind === "logo" ? " " : s.text)).join("");
        let op: number[];
        if (mode === "flicker") {
          const f = flicker(t, at, fps, text);
          op = Array.from(flat).map(() => f);
        } else if (mode === "words") {
          op = [];
          Array.from(flat).forEach((ch, k) => {
            if (k === 0 || (ch !== " " && flat[k - 1] === " ")) wordIdx++;
            const wt = wordTimes?.[wordIdx - 1] ?? at + (wordIdx - 1) * wordGap;
            op.push(t >= wt ? (li > 0 ? flicker(t, wt, fps, `${text}-w${wordIdx}`) : Math.min(1, 0.35 + (t - wt) * 20)) : 0);
          });
        } else {
          op = typeOn(flat, t, lineAt, cps, `${text}-${li}`);
          // later lines flicker in (measured spike pattern on line 2 of samples 3 and 4)
          if (li > 0) op = op.map((o) => o * flicker(t, lineAt, fps, `${text}-L${li}`));
        }
        let ci = 0;
        return (
          <div key={li} style={{ whiteSpace: "nowrap" }}>
            {segs.map((s, si) => {
              if (s.kind === "logo") {
                const on = op[ci] ?? 0;
                ci += 1;
                return <Logo key={si} k={s.text} h={size * 1.05} theme={theme} style={{ margin: "0 0.12em", opacity: on > 0 ? 1 : 0, marginTop: -size * 0.15 }} />;
              }
              const start = ci;
              ci += Array.from(s.text).length;
              const chars = Array.from(s.text).map((ch, k) => (
                <span key={k} style={{ opacity: op[start + k] }}>
                  {ch}
                </span>
              ));
              if (s.kind === "serif")
                return (
                  <span key={si} style={{ ...serifStyle(s.text), fontSize: size * 1.32 }}>
                    {chars}
                  </span>
                );
              if (s.kind === "red")
                return (
                  <span key={si} style={{ ...sansStyle(weight), fontSize: size, color: C.red }}>
                    {chars}
                  </span>
                );
              if (s.kind === "box") {
                // the red box wipes left→right slightly ahead of the letters
                // type: wipes slightly ahead of the letters; words/flicker: follows the words actually shown
                const shown = op.slice(start, start + Array.from(s.text).length);
                const boxP =
                  mode === "type"
                    ? prog(t, lineAt + start / cps - 0.04, Math.max(0.12, s.text.length / cps), (x) => x)
                    : shown.filter((o) => o > 0).length / Math.max(1, shown.length);
                return (
                  <span key={si} style={{ position: "relative", display: "inline-block", padding: "0 0.14em", margin: "0 0.04em" }}>
                    <span
                      style={{
                        position: "absolute",
                        inset: "0.04em 0 -0.02em 0",
                        background: C.redBox,
                        transformOrigin: "left center",
                        transform: `scaleX(${boxP})`,
                      }}
                    />
                    <span style={{ position: "relative", ...sansStyle(weight), fontSize: size, color: C.white }}>{chars}</span>
                  </span>
                );
              }
              return (
                <span key={si} style={{ ...sansStyle(weight), fontSize: size }}>
                  {chars}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
