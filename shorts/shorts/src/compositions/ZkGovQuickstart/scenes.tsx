import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../../theme";
import { Body, Card, CodeSnippet, Heading, Pill, StepLabel } from "./ui";

const Center: React.FC<{ children: React.ReactNode; pad?: number }> = ({
  children,
  pad = 80,
}) => (
  <AbsoluteFill
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: pad,
    }}
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 36, width: "100%", maxWidth: 1600 }}>
      {children}
    </div>
  </AbsoluteFill>
);

const useFadeIn = (delay = 0, dur = 20) => {
  const frame = useCurrentFrame();
  return interpolate(frame - delay, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const HeroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame, fps, config: { damping: 14 } });
  const subIn = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 800px at 50% 30%, ${theme.colors.accent}22, transparent 70%), ${theme.colors.bg}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div style={{ opacity: titleIn, transform: `translateY(${(1 - titleIn) * 20}px)` }}>
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 22,
            letterSpacing: theme.letterSpacing.nav,
            textTransform: "uppercase",
            color: theme.colors.accent,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          ZKGOV · HASHKEY CHAIN
        </div>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 120,
            fontWeight: 800,
            lineHeight: 1.0,
            color: theme.colors.text,
            letterSpacing: "-0.03em",
            textAlign: "center",
          }}
        >
          ANONYMOUS
          <br />
          ON-CHAIN
          <br />
          <span style={{ color: theme.colors.accent }}>VOTING.</span>
        </div>
      </div>
      <div
        style={{
          opacity: subIn,
          marginTop: 40,
          fontFamily: theme.fonts.mono,
          fontSize: 28,
          color: theme.colors.muted,
          textAlign: "center",
        }}
      >
        5 steps. 30 seconds.
      </div>
    </AbsoluteFill>
  );
};

export const FaucetScene: React.FC = () => {
  const frame = useCurrentFrame();
  const bal = interpolate(frame, [20, 90], [0, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Center>
      <StepLabel n={1} title="Get testnet HSK" />
      <Heading>Grab test tokens.</Heading>
      <Body>One-click faucet. 0.25 HSK per request, every 24 hours.</Body>
      <Card style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: 18,
                color: theme.colors.muted,
                letterSpacing: theme.letterSpacing.badge,
                textTransform: "uppercase",
              }}
            >
              Balance
            </div>
            <div
              style={{
                fontFamily: theme.fonts.sans,
                fontSize: 96,
                fontWeight: 700,
                color: theme.colors.text,
                letterSpacing: "-0.02em",
              }}
            >
              {bal.toFixed(3)} <span style={{ color: theme.colors.accent }}>HSK</span>
            </div>
          </div>
          <Pill color={theme.colors.success}>● Claimed</Pill>
        </div>
      </Card>
    </Center>
  );
};

export const ConnectScene: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [10, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Center>
      <StepLabel n={2} title="Connect wallet" />
      <Heading>Connect your wallet.</Heading>
      <Body>MetaMask, Rabby, or any EVM wallet. HashKey Chain testnet.</Body>
      <Card style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 28 }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
            background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentStrong})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: theme.fonts.sans,
            fontSize: 56,
            fontWeight: 800,
            color: "#0a0a0a",
          }}
        >
          W
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: 24,
              color: theme.colors.muted,
              letterSpacing: theme.letterSpacing.badge,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Connected
          </div>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: 44,
              color: theme.colors.text,
              letterSpacing: "0.02em",
            }}
          >
            0X7D71…F49C
          </div>
          <div
            style={{
              marginTop: 18,
              height: 6,
              width: "100%",
              background: theme.colors.border,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress * 100}%`,
                background: theme.colors.accent,
              }}
            />
          </div>
        </div>
      </Card>
    </Center>
  );
};

export const IdentityScene: React.FC = () => {
  const frame = useCurrentFrame();
  const full = "0x1f9a…c7e2b63d8a4f0e2a7b5c9d8e1f3a2b4c5d6e7f8";
  const chars = Math.floor(interpolate(frame, [10, 120], [0, full.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));
  return (
    <Center>
      <StepLabel n={3} title="Generate Semaphore identity" />
      <Heading>Your zero-knowledge identity.</Heading>
      <Body>Generated in-browser. Nobody — not even us — sees your secret.</Body>
      <Card style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <Pill color={theme.colors.accent}>Semaphore</Pill>
          <Pill color={theme.colors.success}>Local</Pill>
          <Pill>Groth16</Pill>
        </div>
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 16,
            color: theme.colors.muted,
            letterSpacing: theme.letterSpacing.badge,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Identity commitment
        </div>
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 36,
            color: theme.colors.text,
            wordBreak: "break-all",
            lineHeight: 1.35,
          }}
        >
          {full.slice(0, chars)}
          <span style={{ color: theme.colors.accent, opacity: frame % 20 < 10 ? 1 : 0 }}>▌</span>
        </div>
      </Card>
    </Center>
  );
};

export const RegisterScene: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [30, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const confirmed = frame > 125;
  return (
    <Center>
      <StepLabel n={4} title="Register on-chain" />
      <Heading>One tx. You're in.</Heading>
      <CodeSnippet
        language="Solidity · ZKGov.sol"
        code={`function register(uint256 identityCommitment) external {
    require(!isRegistered[msg.sender], "Already registered");
    isRegistered[msg.sender] = true;
    semaphore.addMember(groupId, identityCommitment);
}`}
      />
      <Card style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: 18,
              color: theme.colors.muted,
              letterSpacing: theme.letterSpacing.badge,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            {confirmed ? "Confirmed" : "Pending…"}
          </div>
          <div
            style={{
              height: 8,
              width: "100%",
              background: theme.colors.border,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress * 100}%`,
                background: confirmed ? theme.colors.success : theme.colors.accent,
                transition: "background 200ms",
              }}
            />
          </div>
        </div>
        <Pill color={confirmed ? theme.colors.success : theme.colors.accent}>
          {confirmed ? "● Block 8,412,903" : "◐ Mining"}
        </Pill>
      </Card>
    </Center>
  );
};

export const VoteScene: React.FC = () => {
  const frame = useCurrentFrame();
  const proofProgress = interpolate(frame, [40, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const picked = frame > 25;
  const submitted = frame > 130;
  return (
    <Center>
      <StepLabel n={5} title="Vote anonymously" />
      <Heading>Proposal #042</Heading>
      <Body>Fund cross-chain messaging bridge (3-month pilot, 40k HSK).</Body>
      <div style={{ display: "flex", gap: 20, marginTop: 6 }}>
        <VoteChoice
          label="FOR"
          active={picked}
          color={theme.colors.success}
        />
        <VoteChoice label="AGAINST" active={false} color={theme.colors.danger} />
        <VoteChoice label="ABSTAIN" active={false} color={theme.colors.muted} />
      </div>
      <Card style={{ marginTop: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: theme.fonts.mono,
            fontSize: 20,
            color: theme.colors.muted,
            letterSpacing: theme.letterSpacing.badge,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          <span>Generating Groth16 proof</span>
          <span>{Math.round(proofProgress * 100)}%</span>
        </div>
        <div
          style={{
            height: 10,
            width: "100%",
            background: theme.colors.border,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${proofProgress * 100}%`,
              background: submitted ? theme.colors.success : theme.colors.accent,
            }}
          />
        </div>
        {submitted && (
          <div
            style={{
              marginTop: 18,
              fontFamily: theme.fonts.mono,
              fontSize: 28,
              color: theme.colors.success,
            }}
          >
            ✓ Vote submitted · nullifier burned
          </div>
        )}
      </Card>
    </Center>
  );
};

const VoteChoice: React.FC<{ label: string; active: boolean; color: string }> = ({
  label,
  active,
  color,
}) => (
  <div
    style={{
      flex: 1,
      padding: "28px 24px",
      borderRadius: 14,
      border: `2px solid ${active ? color : theme.colors.border}`,
      background: active ? `${color}22` : "transparent",
      fontFamily: theme.fonts.mono,
      fontSize: 32,
      fontWeight: 700,
      letterSpacing: theme.letterSpacing.nav,
      color: active ? color : theme.colors.muted,
      textAlign: "center",
    }}
  >
    {label}
  </div>
);

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        background: theme.colors.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
        opacity: fade,
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.sans,
          fontSize: 104,
          fontWeight: 800,
          color: theme.colors.text,
          textAlign: "center",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
        }}
      >
        You just voted
        <br />
        <span style={{ color: theme.colors.accent }}>anonymously.</span>
      </div>
      <div
        style={{
          marginTop: 48,
          fontFamily: theme.fonts.mono,
          fontSize: 32,
          color: theme.colors.muted,
          letterSpacing: theme.letterSpacing.nav,
          textTransform: "uppercase",
        }}
      >
        zkgov.app
      </div>
    </AbsoluteFill>
  );
};
