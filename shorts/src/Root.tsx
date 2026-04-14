import { Composition } from "remotion";
import { ZkGovQuickstart } from "./compositions/ZkGovQuickstart";

// Load Geist + Geist Mono — must match the web app's typography exactly.
const FONTS = "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600;700&display=swap";

const DURATION = 900; // 30s @ 30fps
const FPS = 30;

export const Root: React.FC = () => {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href={FONTS} />

      {/* 9:16 vertical — TikTok, Reels, YouTube Shorts */}
      <Composition
        id="ZkGovQuickstart"
        component={ZkGovQuickstart}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={DURATION}
      />

      {/* 16:9 wide — YouTube, desktop embed, LinkedIn video */}
      <Composition
        id="ZkGovQuickstartWide"
        component={ZkGovQuickstart}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={DURATION}
      />

      {/* 1:1 square — Instagram feed, Twitter */}
      <Composition
        id="ZkGovQuickstartSquare"
        component={ZkGovQuickstart}
        width={1080}
        height={1080}
        fps={FPS}
        durationInFrames={DURATION}
      />
    </>
  );
};
