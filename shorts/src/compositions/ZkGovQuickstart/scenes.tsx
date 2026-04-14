import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../../theme";
import { Body, Card, CodeSnippet, Heading, Pill, StepLabel, useCanvas } from "./ui";

// ─── Grid background (matches web hero) ──────────────────────────────────────
const GridBg: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage: `
        linear-gradient(to right, rgba(128,128,128,${opacity}) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(128,128,128,${opacity}) 1px, transparent 1px)
      `,
      backgroundSize: "48px 48px",
      pointerEvents: "none",
    }}
  />
);

// ─── Scene wrapper ────────────────────────────────────────────────────────────
// Mobile: single column. Wide: left (text) + right (panel) side-by-side.
const Scene: React.FC<{
  children: React.ReactNode;
  panel?: React.ReactNode;
}> = ({ children, panel }) => {
  const { isWide, u } = useCanvas();

  if (isWide && panel) {
    return (
      <AbsoluteFill
        style={{
          background: theme.colors.bg,
          padding: `${u(60)}px ${u(100)}px`,
          display: "flex",
          flexDirection: "row",
          gap: u(80),
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: "0 0 42%",
            display: "flex",
            flexDirection: "column",
            gap: u(24),
            justifyContent: "center",
          }}
        >
          {children}
        </div>
        <div style={{ flex: 1 }}>{panel}</div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: theme.colors.bg,
        padding: `${u(40)}px ${u(56)}px ${u(64)}px`,
        display: "flex",
        flexDirection: "column",
        gap: u(32),
      }}
    >
      {children}
      {panel}
    </AbsoluteFill>
  );
};

// ─── Scene 0: Hero ───────────────────────────────────────────────────────────
export const HeroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isWide, u } = useCanvas();
  const rise = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const fade = interpolate(frame, [8, 28], [0, 1], { extrapolateRight: "clamp" });

  const textBlock = (
    <>
      <div style={{ opacity: fade }}>
        <Pill color={theme.colors.success}>● Built for HashKey Chain Testnet</Pill>
      </div>
      <div
        style={{
          fontFamily: theme.fonts.sans,
          fontWeight: 800,
          fontSize: isWide ? u(96) : u(140),
          lineHeight: 0.92,
          color: theme.colors.text,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
          transform: `translateY(${(1 - rise) * 36}px)`,
          opacity: rise,
        }}
      >
        The Protocol
        <br />
        For{" "}
        <span
          style={{
            color: "transparent",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            backgroundImage: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentStrong})`,
          }}
        >
          Hybrid
        </span>
        <br />
        Governance.
      </div>
      <div
        style={{
          fontFamily: theme.fonts.mono,
          fontSize: isWide ? u(24) : u(30),
          color: theme.colors.muted,
          opacity: fade,
          lineHeight: 1.5,
          maxWidth: isWide ? 640 : 900,
        }}
      >
        Anonymous governance powered by zero-knowledge proofs.
        Your identity stays private. Your vote is verified on-chain.
      </div>
    </>
  );

  if (isWide) {
    return (
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 70% at 20% 50%, ${theme.colors.accent}18 0%, ${theme.colors.bg} 65%)`,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: `${u(60)}px ${u(100)}px`,
          gap: u(80),
        }}
      >
        <GridBg />
        {/* Left: text */}
        <div
          style={{
            flex: "0 0 55%",
            display: "flex",
            flexDirection: "column",
            gap: u(28),
          }}
        >
          {textBlock}
        </div>
        {/* Right: logo mark + tech pills */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: u(28),
            opacity: fade,
          }}
        >
          <div
            style={{
              width: u(180),
              height: u(180),
              borderRadius: u(8),
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentStrong})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: theme.fonts.sans,
              fontWeight: 800,
              fontSize: u(110),
              color: "#0a0a0a",
              boxShadow: `0 0 ${u(80)}px ${theme.colors.accent}44`,
            }}
          >
            Z
          </div>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: u(20),
              color: theme.colors.muted,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            → zkgov.xyz
          </div>
          <div style={{ display: "flex", gap: u(10), flexWrap: "wrap", justifyContent: "center" }}>
            <Pill color={theme.colors.accent}>Semaphore v4</Pill>
            <Pill color={theme.colors.muted}>Groth16</Pill>
            <Pill color={theme.colors.muted}>EVM</Pill>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // Mobile vertical layout
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 80% 50% at 50% 30%, ${theme.colors.accent}18 0%, ${theme.colors.bg} 65%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: u(72),
        gap: u(40),
      }}
    >
      <GridBg />
      {textBlock}
      <div
        style={{
          fontFamily: theme.fonts.mono,
          fontSize: u(20),
          color: theme.colors.muted,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          opacity: fade,
          marginTop: "auto",
        }}
      >
        → zkgov.xyz
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 1: Get testnet HSK ────────────────────────────────────────────────
export const FaucetScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { u } = useCanvas();
  const barProgress = interpolate(frame, [20, durationInFrames - 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const balance = (barProgress * 0.25).toFixed(3);
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });

  return (
    <Scene
      panel={
        <Card
          style={{ opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: u(13),
                fontWeight: 700,
                color: theme.colors.muted,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Balance
            </div>
            <Pill color={theme.colors.accent}>HSK Testnet</Pill>
          </div>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: u(96),
              fontWeight: 700,
              color: theme.colors.text,
              marginTop: u(10),
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {balance}
            <span style={{ color: theme.colors.muted, fontSize: u(44), marginLeft: u(12) }}>
              HSK
            </span>
          </div>
          {/* Progress bar */}
          <div
            style={{
              height: u(6),
              background: "rgba(255,255,255,0.05)",
              borderRadius: 999,
              overflow: "hidden",
              marginTop: u(24),
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${barProgress * 100}%`,
                background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accentStrong})`,
                boxShadow: `0 0 ${u(16)}px ${theme.colors.accent}66`,
              }}
            />
          </div>
          <div
            style={{
              marginTop: u(16),
              fontFamily: theme.fonts.mono,
              fontSize: u(18),
              color: barProgress >= 1 ? theme.colors.success : theme.colors.muted,
              display: "flex",
              alignItems: "center",
              gap: u(8),
            }}
          >
            {barProgress >= 1 ? (
              <>
                <span
                  style={{
                    width: u(7),
                    height: u(7),
                    borderRadius: "50%",
                    background: theme.colors.success,
                    boxShadow: `0 0 ${u(8)}px ${theme.colors.success}`,
                    display: "inline-block",
                  }}
                />
                Tokens received
              </>
            ) : (
              <>
                <span
                  style={{
                    width: u(7),
                    height: u(7),
                    borderRadius: "50%",
                    background: theme.colors.accent,
                    display: "inline-block",
                  }}
                />
                Requesting from faucet…
              </>
            )}
          </div>
        </Card>
      }
    >
      <StepLabel n={1} title="Get testnet HSK" />
      <Heading>Grab gas from the faucet.</Heading>
      <Body>
        HashKey Chain testnet uses HSK as its native gas token. You only need a
        fraction — gas on L2 is cheap.
      </Body>
    </Scene>
  );
};

// ─── Scene 2: Connect wallet ─────────────────────────────────────────────────
export const ConnectScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useCanvas();
  const connectAt = fps * 2;
  const connected = frame >= connectAt;
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });

  return (
    <Scene
      panel={
        <Card
          style={{ opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: u(20) }}>
            {/* Avatar */}
            <div
              style={{
                width: u(72),
                height: u(72),
                borderRadius: u(4),
                background: `conic-gradient(from 120deg, ${theme.colors.accent}, ${theme.colors.accentStrong}, #7c3aed, ${theme.colors.accent})`,
                boxShadow: connected ? `0 0 ${u(28)}px ${theme.colors.accent}55` : "none",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: u(32),
                  fontWeight: 600,
                  color: theme.colors.text,
                  letterSpacing: connected ? "0.02em" : "inherit",
                }}
              >
                {connected ? "0X7D71...F49C" : "Connecting…"}
              </div>
              <div
                style={{
                  marginTop: u(8),
                  fontFamily: theme.fonts.mono,
                  fontSize: u(18),
                  color: connected ? theme.colors.success : theme.colors.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: u(7),
                }}
              >
                <span
                  style={{
                    width: u(7),
                    height: u(7),
                    borderRadius: "50%",
                    background: connected ? theme.colors.success : theme.colors.muted,
                    boxShadow: connected ? `0 0 ${u(8)}px ${theme.colors.success}` : "none",
                    display: "inline-block",
                  }}
                />
                {connected ? "HashKey Chain Testnet" : "Switching network…"}
              </div>
            </div>
          </div>

          {/* WalletConnect providers row */}
          <div
            style={{
              marginTop: u(24),
              paddingTop: u(20),
              borderTop: `1px solid ${theme.colors.border}`,
              display: "flex",
              gap: u(10),
            }}
          >
            {["MetaMask", "Rabby", "Coinbase", "WalletConnect"].map((w) => (
              <div
                key={w}
                style={{
                  flex: 1,
                  padding: `${u(10)}px 0`,
                  textAlign: "center",
                  fontFamily: theme.fonts.mono,
                  fontSize: u(13),
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: theme.colors.muted,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: u(4),
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                {w}
              </div>
            ))}
          </div>
        </Card>
      }
    >
      <StepLabel n={2} title="Connect your wallet" />
      <Heading>Click Connect. Sign in.</Heading>
      <Body>
        MetaMask, Rabby, Coinbase Wallet, any WalletConnect provider. The app
        adds HashKey Chain testnet automatically.
      </Body>
    </Scene>
  );
};

// ─── Scene 3: Create ZK identity ─────────────────────────────────────────────
export const IdentityScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useCanvas();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const signedAt = fps * 2;
  const revealFrac = interpolate(frame, [signedAt, signedAt + fps * 1.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const commitment =
    "0x8f3a2c9e1b4d7f0a6e2b8c5a9d3f1e7b4c6a8e2f0b9d7c3a5e1f8b4d2c6a9e3f";
  const shown = commitment.slice(0, Math.floor(revealFrac * commitment.length));

  return (
    <Scene
      panel={
        <Card
          style={{ opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: u(13),
                fontWeight: 700,
                color: theme.colors.muted,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Semaphore Identity
            </div>
            <Pill color={theme.colors.accent}>Deterministic</Pill>
          </div>

          <div
            style={{
              marginTop: u(24),
              fontFamily: theme.fonts.mono,
              fontSize: u(13),
              color: theme.colors.muted,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Identity Commitment
          </div>
          <div
            style={{
              marginTop: u(10),
              fontFamily: theme.fonts.mono,
              fontSize: u(22),
              color: theme.colors.accent,
              wordBreak: "break-all",
              lineHeight: 1.4,
              minHeight: u(100),
              letterSpacing: "0.01em",
            }}
          >
            {shown}
            <span
              style={{
                opacity: Math.floor(frame / 7) % 2 === 0 ? 1 : 0,
                color: theme.colors.accent,
                marginLeft: 2,
              }}
            >
              ▍
            </span>
          </div>

          <div
            style={{
              marginTop: u(20),
              paddingTop: u(16),
              borderTop: `1px solid ${theme.colors.border}`,
              fontFamily: theme.fonts.mono,
              fontSize: u(14),
              color: theme.colors.muted,
              letterSpacing: "0.05em",
            }}
          >
            Derived from wallet signature. Never transmitted.
          </div>
        </Card>
      }
    >
      <StepLabel n={3} title="Create your ZK identity" />
      <Heading>Sign once. Identity forever.</Heading>
      <Body>
        Your identity is derived from the signature — same wallet always
        produces the same identity. No seed phrase needed.
      </Body>
    </Scene>
  );
};

// ─── Scene 4: Register on-chain ──────────────────────────────────────────────
export const RegisterScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { u } = useCanvas();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const txProgress = interpolate(frame, [fps, durationInFrames - 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const confirmed = txProgress >= 1;

  return (
    <Scene
      panel={
        <div
          style={{
            opacity: enter,
            transform: `translateY(${(1 - enter) * 20}px)`,
            display: "flex",
            flexDirection: "column",
            gap: u(16),
          }}
        >
          <CodeSnippet
            language="solidity"
            code={`function register(
    uint256 identityCommitment
) external {
    require(
        !isRegistered[msg.sender],
        "Already registered"
    );
    isRegistered[msg.sender] = true;
    semaphore.addMember(
        groupId,
        identityCommitment
    );
}`}
          />
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: u(13),
                  fontWeight: 700,
                  color: theme.colors.muted,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Transaction
              </div>
              <Pill color={confirmed ? theme.colors.success : theme.colors.accent}>
                {confirmed ? "Confirmed" : "Pending"}
              </Pill>
            </div>
            <div
              style={{
                height: u(5),
                background: "rgba(255,255,255,0.05)",
                borderRadius: 999,
                overflow: "hidden",
                marginTop: u(20),
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${txProgress * 100}%`,
                  background: confirmed
                    ? `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.success})`
                    : `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accentStrong})`,
                  boxShadow: confirmed ? `0 0 ${u(12)}px ${theme.colors.success}66` : "none",
                }}
              />
            </div>
          </Card>
        </div>
      }
    >
      <StepLabel n={4} title="Register on-chain" />
      <Heading>One tx. Commitment lands.</Heading>
      <Body>
        Your address is linked to the commitment hash — not your identity
        secret. That stays in your browser.
      </Body>
    </Scene>
  );
};

// ─── Scene 5: Cast vote ──────────────────────────────────────────────────────
export const VoteScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u } = useCanvas();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const pickAt = fps * 1.2;
  const proofAt = fps * 2;
  const doneAt = fps * 3.6;
  const proofProgress = interpolate(frame, [proofAt, doneAt], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const picked = frame >= pickAt;
  const done = frame >= doneAt;

  return (
    <Scene
      panel={
        <Card
          style={{ opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` }}
        >
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: u(13),
              fontWeight: 700,
              color: theme.colors.muted,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Proposal #042
          </div>
          <div
            style={{
              marginTop: u(8),
              fontFamily: theme.fonts.sans,
              fontSize: u(36),
              fontWeight: 700,
              color: theme.colors.text,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}
          >
            Fund the cross-chain messaging bridge
          </div>

          {/* Vote buttons */}
          <div style={{ display: "flex", gap: u(10), marginTop: u(28) }}>
            {[
              { label: "FOR", color: theme.colors.success, active: picked },
              { label: "AGAINST", color: theme.colors.danger, active: false },
              { label: "ABSTAIN", color: theme.colors.muted, active: false },
            ].map((v) => (
              <div
                key={v.label}
                style={{
                  flex: 1,
                  padding: `${u(18)}px 0`,
                  textAlign: "center",
                  fontFamily: theme.fonts.mono,
                  fontSize: u(18),
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: v.active ? v.color : theme.colors.muted,
                  border: `1px solid ${v.active ? v.color + "88" : theme.colors.border}`,
                  borderRadius: u(4),
                  background: v.active ? `${v.color}12` : "transparent",
                  boxShadow: v.active ? `0 0 ${u(20)}px ${v.color}33` : "none",
                }}
              >
                {v.label}
              </div>
            ))}
          </div>

          {/* Proof status */}
          <div style={{ marginTop: u(24) }}>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: u(18),
                color: done
                  ? theme.colors.success
                  : proofProgress > 0
                  ? theme.colors.accent
                  : theme.colors.muted,
                display: "flex",
                alignItems: "center",
                gap: u(8),
              }}
            >
              {(done || proofProgress > 0) && (
                <span
                  style={{
                    width: u(7),
                    height: u(7),
                    borderRadius: "50%",
                    background: done ? theme.colors.success : theme.colors.accent,
                    boxShadow: `0 0 ${u(8)}px ${done ? theme.colors.success : theme.colors.accent}`,
                    display: "inline-block",
                  }}
                />
              )}
              {done
                ? "Vote submitted anonymously"
                : proofProgress > 0
                ? "Generating Groth16 proof locally…"
                : picked
                ? "Preparing proof…"
                : "Select a choice…"}
            </div>
            <div
              style={{
                height: u(5),
                background: "rgba(255,255,255,0.05)",
                borderRadius: 999,
                overflow: "hidden",
                marginTop: u(12),
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${proofProgress * 100}%`,
                  background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.success})`,
                  boxShadow: done ? `0 0 ${u(12)}px ${theme.colors.success}66` : "none",
                }}
              />
            </div>
          </div>
        </Card>
      }
    >
      <StepLabel n={5} title="Cast your first vote" />
      <Heading>Pick. Prove. Ship.</Heading>
      <Body>
        The browser generates a Groth16 proof locally — a few seconds — then
        submits on-chain. The tally is public. Your choice never is.
      </Body>
    </Scene>
  );
};

// ─── Scene 6: Outro ──────────────────────────────────────────────────────────
export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isWide, u } = useCanvas();
  const pop = spring({ frame, fps, config: { damping: 10, stiffness: 180 } });
  const fade = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: theme.colors.accentStrong,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: isWide ? `${u(60)}px ${u(120)}px` : u(80),
        gap: u(28),
      }}
    >
      <GridBg opacity={0.12} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: u(10),
          opacity: fade,
        }}
      >
        <span
          style={{
            width: u(8),
            height: u(8),
            borderRadius: "50%",
            background: "#fff",
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: u(14),
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Done
        </span>
      </div>
      <div
        style={{
          fontFamily: theme.fonts.sans,
          fontWeight: 800,
          fontSize: isWide ? u(88) : u(108),
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 0.95,
          transform: `scale(${0.88 + pop * 0.12})`,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        You just voted
        <br />
        <span style={{ color: "rgba(255,255,255,0.55)" }}>anonymously.</span>
      </div>
      <div
        style={{
          fontFamily: theme.fonts.mono,
          fontSize: u(22),
          color: "rgba(255,255,255,0.5)",
          textAlign: "center",
          opacity: pop,
          marginTop: u(12),
          letterSpacing: "0.05em",
        }}
      >
        zkgov.xyz · built on HashKey Chain
      </div>
    </AbsoluteFill>
  );
};
