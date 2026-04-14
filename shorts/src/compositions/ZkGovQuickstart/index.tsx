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

// ─── Audio ────────────────────────────────────────────────────────────────────
// Set to true once you've added audio files to public/audio/.
// See public/audio/README.md for the full file spec.
const AUDIO_ENABLED = false;

// Absolute frame offsets for each scene (used to time SFX precisely).
const F = {
  hero: 0,
  faucet: 120,
  connect: 240,
  identity: 360,
  register: 510,
  vote: 660,
  outro: 810,
};

// ─── Composition ─────────────────────────────────────────────────────────────

export const ZkGovQuickstart: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: theme.colors.bg, color: theme.colors.text }}>
      {/* ── Audio tracks ──────────────────────────────────────────────────── */}
      {AUDIO_ENABLED && (
        <>
          {/* Ambient music bed — full 30s at low volume */}
          <Audio
            src={staticFile("audio/music-bed.mp3")}
            volume={0.22}
            loop
          />

          {/* Scene transition whooshes — fires 3 frames before each cut */}
          {[F.faucet, F.connect, F.identity, F.register, F.vote, F.outro].map(
            (cutFrame, i) => (
              <Sequence key={i} from={cutFrame - 3} durationInFrames={22}>
                <Audio src={staticFile("audio/whoosh.mp3")} volume={0.5} />
              </Sequence>
            )
          )}

          {/* Typewriter sound during identity commitment reveal */}
          <Sequence from={F.identity + 62} durationInFrames={48}>
            <Audio src={staticFile("audio/keytype.mp3")} volume={0.28} />
          </Sequence>

          {/* Chime when register tx confirms */}
          <Sequence from={F.register + 138} durationInFrames={30}>
            <Audio src={staticFile("audio/chime.mp3")} volume={0.6} />
          </Sequence>

          {/* Success sting when vote is submitted */}
          <Sequence from={F.vote + 110} durationInFrames={35}>
            <Audio src={staticFile("audio/success.mp3")} volume={0.72} />
          </Sequence>
        </>
      )}

      {/* ── Scenes ────────────────────────────────────────────────────────── */}
      {/* 30 seconds @ 30fps = 900 frames total.
          Hero     0   – 120   (4s)
          Faucet   120 – 240   (4s)
          Connect  240 – 360   (4s)
          Identity 360 – 510   (5s)
          Register 510 – 660   (5s)
          Vote     660 – 810   (5s)
          Outro    810 – 900   (3s)  */}

      <Sequence from={F.hero} durationInFrames={120}>
        <HeroScene />
      </Sequence>

      <Sequence from={F.faucet} durationInFrames={120}>
        <Chrome active="DOCS">
          <FaucetScene />
        </Chrome>
      </Sequence>

      <Sequence from={F.connect} durationInFrames={120}>
        <Chrome active="DASHBOARD">
          <ConnectScene />
        </Chrome>
      </Sequence>

      <Sequence from={F.identity} durationInFrames={150}>
        <Chrome active="PROFILE">
          <IdentityScene />
        </Chrome>
      </Sequence>

      <Sequence from={F.register} durationInFrames={150}>
        <Chrome active="PROFILE">
          <RegisterScene />
        </Chrome>
      </Sequence>

      <Sequence from={F.vote} durationInFrames={150}>
        <Chrome active="PROPOSALS">
          <VoteScene />
        </Chrome>
      </Sequence>

      <Sequence from={F.outro} durationInFrames={90}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

// ─── App chrome (TopBar + content area) ──────────────────────────────────────
const Chrome: React.FC<{ active: string; children: React.ReactNode }> = ({
  active,
  children,
}) => (
  <AbsoluteFill style={{ background: theme.colors.bg, display: "flex", flexDirection: "column" }}>
    <TopBar active={active} />
    <div style={{ flex: 1, position: "relative" }}>{children}</div>
  </AbsoluteFill>
);
