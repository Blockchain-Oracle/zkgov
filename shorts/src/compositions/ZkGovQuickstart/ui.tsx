import { useVideoConfig } from "remotion";
import { theme } from "../../theme";

// ─── Canvas / responsive helpers ─────────────────────────────────────────────

/**
 * Returns responsive sizing helpers keyed to the current Remotion canvas.
 *
 * Both the mobile (1080×1920) and wide (1920×1080) canvases share a
 * 1080px minor axis, so sizes produced by u() are visually equivalent
 * across formats.  isWide lets scenes opt into a two-column layout.
 */
export function useCanvas() {
  const { width, height } = useVideoConfig();
  const isWide = width > height;
  const minor = Math.min(width, height);
  const s = minor / 1080;
  /** Scale a pixel value from the 1080-reference to the current canvas. */
  const u = (px: number) => px * s;
  return { width, height, isWide, u };
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

export const StepLabel: React.FC<{ n: number; title: string }> = ({ n, title }) => {
  const { u } = useCanvas();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: u(12),
        fontFamily: theme.fonts.mono,
        fontSize: u(18),
        fontWeight: 600,
        letterSpacing: theme.letterSpacing.nav,
        textTransform: "uppercase",
        color: theme.colors.accent,
      }}
    >
      <span
        style={{
          width: u(40),
          height: u(40),
          borderRadius: u(4),
          background: `${theme.colors.accent}18`,
          border: `1px solid ${theme.colors.accent}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: u(18),
          color: theme.colors.accent,
          flexShrink: 0,
        }}
      >
        {String(n).padStart(2, "0")}
      </span>
      Step {n} / 5 · {title}
    </div>
  );
};

export const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { u, isWide } = useCanvas();
  return (
    <div
      style={{
        fontFamily: theme.fonts.sans,
        fontSize: isWide ? u(76) : u(84),
        fontWeight: 800,
        lineHeight: 1.0,
        color: theme.colors.text,
        letterSpacing: "-0.03em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
};

export const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { u } = useCanvas();
  return (
    <div
      style={{
        fontFamily: theme.fonts.mono,
        fontSize: u(26),
        lineHeight: 1.6,
        color: theme.colors.muted,
      }}
    >
      {children}
    </div>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => {
  const { u } = useCanvas();
  return (
    <div
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: u(4),
        padding: u(32),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Pill: React.FC<{
  children: React.ReactNode;
  color?: string;
}> = ({ children, color = theme.colors.muted }) => {
  const { u } = useCanvas();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: u(6),
        fontFamily: theme.fonts.mono,
        fontSize: u(14),
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color,
        padding: `${u(5)}px ${u(12)}px`,
        borderRadius: u(4),
        border: `1px solid ${color}44`,
        background: `${color}12`,
      }}
    >
      {children}
    </span>
  );
};

// Solidity syntax painter — just enough tint to avoid a flat wall of text.
export const CodeSnippet: React.FC<{ code: string; language: string }> = ({
  code,
  language,
}) => {
  const { u } = useCanvas();
  const tokens = code
    .split(/(\s+|[(){}\[\];,.])/)
    .filter((t) => t.length > 0);
  const keywords = new Set([
    "function", "external", "require", "public", "private",
    "returns", "uint256", "bool", "true", "false", "address",
  ]);
  return (
    <div
      style={{
        background: theme.colors.codeBg,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: u(4),
        fontFamily: theme.fonts.mono,
        overflow: "hidden",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          padding: `${u(12)}px ${u(20)}px`,
          borderBottom: `1px solid ${theme.colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: u(7) }}>
          <Dot color="#ff5f57" size={u(11)} />
          <Dot color="#febc2e" size={u(11)} />
          <Dot color="#28c840" size={u(11)} />
        </div>
        <div
          style={{
            fontSize: u(13),
            color: theme.colors.muted,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          {language}
        </div>
      </div>
      {/* Code */}
      <pre
        style={{
          margin: 0,
          padding: u(28),
          fontSize: u(23),
          lineHeight: 1.6,
          color: "#d4d4d8",
          whiteSpace: "pre-wrap",
        }}
      >
        {tokens.map((t, i) => {
          if (keywords.has(t))
            return <span key={i} style={{ color: theme.colors.accent }}>{t}</span>;
          if (/^"[^"]*"$/.test(t))
            return <span key={i} style={{ color: theme.colors.success }}>{t}</span>;
          if (/^[A-Z][a-zA-Z]*$/.test(t))
            return <span key={i} style={{ color: "#7dd3fc" }}>{t}</span>;
          return <span key={i}>{t}</span>;
        })}
      </pre>
    </div>
  );
};

const Dot: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
    }}
  />
);
