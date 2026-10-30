import React from "react";
import { Composition, staticFile } from "remotion";
import { KallawayVideo } from "./KallawayVideo";

// plan.json lives in public/ so editing it never needs a code change.
const fromPlan = (file: string) => async () => {
  const plan = await fetch(staticFile(file)).then((r) => r.json());
  return { fps: plan.fps, durationInFrames: Math.ceil(plan.duration * plan.fps), props: { plan } };
};

export const Root = () => (
  <>
  <Composition
    id="Kallaway"
    component={KallawayVideo as any}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={300}
    defaultProps={{ plan: null }}
    calculateMetadata={fromPlan("plan.json")}
  />
  {/* thumbnail = one designed frame of the same system (public/plan_thumb.json) */}
  <Composition
    id="Thumb"
    component={KallawayVideo as any}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={300}
    defaultProps={{ plan: null }}
    calculateMetadata={fromPlan("plan_thumb.json")}
  />
  </>
);
