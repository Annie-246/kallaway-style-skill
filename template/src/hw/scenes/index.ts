// Scene registry: plan.json "type" → component. Add new scene types here.
import { Chart } from "./Chart";
import { Cards3D, Doc, DocGrid } from "./Objects";
import { Timeline, Tree } from "./Maps";
import { ChipList, Logos, ReelGrid, Showcase, SideTags, UICard } from "./MediaScenes";
import { Badge, Orbit, Progress } from "./Motion4";
import { Illus } from "./Illus";

export const SCENES: Record<string, any> = {
  chart: Chart,
  cards3d: Cards3D,
  doc: Doc,
  docgrid: DocGrid,
  timeline: Timeline,
  tree: Tree,
  reelgrid: ReelGrid,
  uicard: UICard,
  showcase: Showcase,
  list: ChipList,
  sidetags: SideTags,
  logos: Logos,
  badge: Badge,
  orbit: Orbit,
  progress: Progress,
  illus: Illus,
  none: () => null,
};
