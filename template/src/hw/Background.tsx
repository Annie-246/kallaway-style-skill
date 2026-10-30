// Two canvases only: near-black with a faint dot grid, or light grey "graph paper".
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, Theme } from "./tokens";

export const Background: React.FC<{ theme: Theme }> = ({ theme }) =>
  theme === "light" ? (
    <AbsoluteFill
      style={{
        backgroundColor: C.bgLight,
        backgroundImage: [
          "radial-gradient(rgba(0,0,0,0.10) 1px, transparent 1.3px)",
          "linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "11px 11px, 44px 44px, 44px 44px",
      }}
    >
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.35), transparent 70%)" }} />
    </AbsoluteFill>
  ) : (
    <AbsoluteFill
      style={{
        backgroundColor: C.bgDark,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.075) 1.2px, transparent 1.6px)",
        backgroundSize: "32px 32px",
      }}
    >
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
