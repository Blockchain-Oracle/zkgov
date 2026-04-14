import { theme } from "../../theme";
import { useCanvas } from "./ui";

export const TopBar: React.FC<{ active: string }> = ({ active }) => {
  const { u, isWide } = useCanvas();
  const hPad = isWide ? 100 : 40;
  const vPad = isWide ? 20 : 28;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: u(14),
        padding: `${u(vPad)}px ${u(hPad)}px`,
        borderBottom: `1px solid ${theme.colors.border}`,
        fontFamily: theme.fonts.mono,
        background: theme.colors.bg,
      }}
    >
      {/* Logo mark + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: u(12) }}>
        <div
          style={{
            width: u(44),
            height: u(44),
            borderRadius: u(4),
            background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentStrong})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: theme.fonts.sans,
            fontWeight: 800,
            fontSize: u(26),
            color: "#0a0a0a",
          }}
        >
          Z
        </div>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: u(28),
            fontWeight: 700,
            color: theme.colors.text,
            letterSpacing: "-0.01em",
          }}
        >
          ZKGov
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: u(22),
          background: theme.colors.border,
          marginLeft: u(4),
          marginRight: u(4),
        }}
      />

      {/* Active nav pill */}
      <div
        style={{
          fontSize: u(13),
          fontWeight: 700,
          letterSpacing: "0.15em",
          padding: `${u(6)}px ${u(14)}px`,
          borderRadius: u(4),
          color: theme.colors.text,
          background: "rgba(255, 255, 255, 0.05)",
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          textTransform: "uppercase",
        }}
      >
        {active}
      </div>

      <div style={{ flex: 1 }} />

      {/* Network badge */}
      {isWide && (
        <div
          style={{
            fontSize: u(12),
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: theme.colors.muted,
            textTransform: "uppercase",
          }}
        >
          HashKey Chain · Testnet
        </div>
      )}

      {/* Wallet pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: u(8),
          padding: `${u(8)}px ${u(14)}px`,
          borderRadius: u(4),
          border: `1px solid ${theme.colors.border}`,
          background: "rgba(255, 255, 255, 0.02)",
          fontSize: u(15),
          color: theme.colors.text,
          letterSpacing: "0.04em",
          fontFamily: theme.fonts.mono,
        }}
      >
        <div
          style={{
            width: u(8),
            height: u(8),
            borderRadius: "50%",
            background: theme.colors.success,
            boxShadow: `0 0 ${u(10)}px ${theme.colors.success}`,
          }}
        />
        0X7D71...F49C
      </div>
    </div>
  );
};
