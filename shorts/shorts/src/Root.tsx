import { Composition, staticFile } from "remotion";
import { loadFont as loadSans } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { ZkGovQuickstart } from "./compositions/ZkGovQuickstart";

loadSans();
loadMono();

// 30 seconds @ 30fps = 900 frames.
// Vertical (reels/shorts/tiktok) and landscape (youtube/X) share the same
// scenes — the scenes are AbsoluteFill + flex-centered so they adapt.
export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ZkGovQuickstart"
        component={ZkGovQuickstart}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ZkGovQuickstartWide"
        component={ZkGovQuickstart}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ZkGovQuickstartSquare"
        component={ZkGovQuickstart}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
