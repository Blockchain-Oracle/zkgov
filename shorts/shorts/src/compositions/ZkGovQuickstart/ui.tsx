import { theme } from "../../theme";

export const StepLabel: React.FC<{ n: number; title: string }> = ({ n, title }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontFamily: theme.fonts.mono,
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: theme.letterSpacing.nav,
      textTransform: "uppercase",
      color: theme.colors.accent,
    }}
  >
    <span
      style={{
        width: 42,
        height: 42,
        borderRadius: 10,
        background: `${theme.colors.accent}22`,
        border: `1px solid ${theme.colors.accent}55`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        color: theme.colors.accent,
      }}
    >
      {String(n).padStart(2, "0")}
    </span>
    Step {n} / 5 · {title}
  </div>
);

export const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: theme.fonts.sans,
      fontSize: 88,
      fontWeight: 700,
      lineHeight: 1.05,
      color: theme.colors.text,
      letterSpacing: "-0.02em",
    }}
  >
    {children}
  </div>
);

export const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: theme.fonts.mono,
      fontSize: 30,
      lineHeight: 1.5,
      color: theme.colors.muted,
      maxWidth: 920,
    }}
  >
    {children}
  </div>
);

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 16,
      padding: 36,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Pill: React.FC<{
  children: React.ReactNode;
  color?: string;
}> = ({ children, color = theme.colors.muted }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontFamily: theme.fonts.mono,
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: theme.letterSpacing.badge,
      textTransform: "uppercase",
      color,
      padding: "6px 12px",
      borderRadius: 6,
      border: `1px solid ${color}33`,
      background: `${color}15`,
    }}
  >
    {children}
  </span>
);

export const CodeSnippet: React.FC<{ code: string; language: string }> = ({
  code,
  language,
}) => {
  const tokens = code.split(/(\s+|[(){}\[\];,.])/).filter((t) => t.length > 0);
  const keywords = new Set([
    "function",
    "external",
    "require",
    "public",
    "private",
    "returns",
    "uint256",
    "bool",
    "true",
    "false",
    "address",
  ]);
  return (
    <div
      style={{
        background: theme.colors.codeBg,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 14,
        fontFamily: theme.fonts.mono,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 22px",
          borderBottom: `1px solid ${theme.colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <Dot color="#ff5f57" />
          <Dot color="#febc2e" />
          <Dot color="#28c840" />
        </div>
        <div
          style={{
            fontSize: 16,
            color: theme.colors.muted,
            letterSpacing: theme.letterSpacing.badge,
            textTransform: "uppercase",
          }}
        >
          {language}
        </div>
      </div>
      <pre
        style={{
          margin: 0,
          padding: 32,
          fontSize: 26,
          lineHeight: 1.55,
          color: "#d4d4d8",
          whiteSpace: "pre-wrap",
        }}
      >
        {tokens.map((t, i) => {
          if (keywords.has(t)) {
            return (
              <span key={i} style={{ color: theme.colors.accent }}>
                {t}
              </span>
            );
          }
          if (/^"[^"]*"$/.test(t)) {
            return (
              <span key={i} style={{ color: theme.colors.success }}>
                {t}
              </span>
            );
          }
          if (/^[A-Z][a-zA-Z]*$/.test(t)) {
            return (
              <span key={i} style={{ color: "#7dd3fc" }}>
                {t}
              </span>
            );
          }
          return <span key={i}>{t}</span>;
        })}
      </pre>
    </div>
  );
};

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <div
    style={{
      width: 12,
      height: 12,
      borderRadius: "50%",
      background: color,
    }}
  />
);
