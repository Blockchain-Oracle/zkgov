import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { theme } from "../../theme";
import { TopBar } from "./TopBar";
import {
  ConnectScene,
  FaucetScene,
  HeroScene,
  IdentityScene,
  OutroScene,
  RegisterScene,
  VoteScene,
} from "./scenes";

// 30 seconds @ 30fps = 900 frames total.
// Scene budget (frames → seconds):
//   Hero     0   – 120  (4s)
//   Faucet   120 – 240  (4s)
//   Connect  240 – 360  (4s)
//   Identity 360 – 510  (5s)
//   Register 510 – 660  (5s)
//   Vote     660 – 810  (5s)
//   Outro    810 – 900  (3s)
//
// Audio: drop files into packages/shorts/public/audio/ — Remotion will
// resolve them via staticFile(). Missing files simply render silent; no
// crash. See README for the expected file list and suggested sources.

const tryAudio = (file: string) => {
  try {
    return staticFile(file);
  } catch {
    return null;
  }
};

export const ZkGovQuickstart: React.FC = () => {
  const musicBed = tryAudio("audio/music-bed.mp3");
  const sfxWhoosh = tryAudio("audio/whoosh.mp3");
  const sfxType = tryAudio("audio/keytype.mp3");
  const sfxChime = tryAudio("audio/chime.mp3");
  const sfxSuccess = tryAudio("audio/success.mp3");

  return (
    <AbsoluteFill style={{ background: theme.colors.bg, color: theme.colors.text }}>
      {/* Music bed — low volume, runs the whole video */}
      {musicBed && <Audio src={musicBed} volume={0.35} />}

      {/* Scenes */}
      <Sequence from={0} durationInFrames={120}>
        <HeroScene />
      </Sequence>
      <Sequence from={120} durationInFrames={120}>
        <Chrome active="DOCS">
          <FaucetScene />
        </Chrome>
      </Sequence>
      <Sequence from={240} durationInFrames={120}>
        <Chrome active="DASHBOARD">
          <ConnectScene />
        </Chrome>
      </Sequence>
      <Sequence from={360} durationInFrames={150}>
        <Chrome active="PROFILE">
          <IdentityScene />
        </Chrome>
      </Sequence>
      <Sequence from={510} durationInFrames={150}>
        <Chrome active="PROFILE">
          <RegisterScene />
        </Chrome>
      </Sequence>
      <Sequence from={660} durationInFrames={150}>
        <Chrome active="PROPOSALS">
          <VoteScene />
        </Chrome>
      </Sequence>
      <Sequence from={810} durationInFrames={90}>
        <OutroScene />
      </Sequence>

      {/* SFX — one per scene transition + payoff beats */}
      {sfxWhoosh && (
        <>
          <Sequence from={0} durationInFrames={30}>
            <Audio src={sfxWhoosh} volume={0.7} />
          </Sequence>
          <Sequence from={120} durationInFrames={30}>
            <Audio src={sfxWhoosh} volume={0.5} />
          </Sequence>
          <Sequence from={240} durationInFrames={30}>
            <Audio src={sfxWhoosh} volume={0.5} />
          </Sequence>
          <Sequence from={360} durationInFrames={30}>
            <Audio src={sfxWhoosh} volume={0.5} />
          </Sequence>
          <Sequence from={510} durationInFrames={30}>
            <Audio src={sfxWhoosh} volume={0.5} />
          </Sequence>
          <Sequence from={660} durationInFrames={30}>
            <Audio src={sfxWhoosh} volume={0.5} />
          </Sequence>
          <Sequence from={810} durationInFrames={30}>
            <Audio src={sfxWhoosh} volume={0.6} />
          </Sequence>
        </>
      )}
      {/* Identity commitment typewriter */}
      {sfxType && (
        <Sequence from={370} durationInFrames={110}>
          <Audio src={sfxType} volume={0.25} />
        </Sequence>
      )}
      {/* Register confirmation */}
      {sfxChime && (
        <Sequence from={635} durationInFrames={25}>
          <Audio src={sfxChime} volume={0.6} />
        </Sequence>
      )}
      {/* Vote submitted */}
      {sfxSuccess && (
        <Sequence from={790} durationInFrames={30}>
          <Audio src={sfxSuccess} volume={0.75} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

const Chrome: React.FC<{ active: string; children: React.ReactNode }> = ({
  active,
  children,
}) => (
  <AbsoluteFill style={{ background: theme.colors.bg }}>
    <TopBar active={active} />
    <div style={{ flex: 1, position: "relative" }}>{children}</div>
  </AbsoluteFill>
);
